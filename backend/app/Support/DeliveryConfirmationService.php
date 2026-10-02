<?php

namespace App\Support;

use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\DeliveryConfirmation;
use App\Models\Equipment;

/**
 * Orchestrates the three-party delivery confirmation (recipient, supplier,
 * church). Equipment only moves to "verified" once ALL THREE parties have
 * confirmed, then the parent request advances from procurement to delivered.
 */
class DeliveryConfirmationService
{
    public const PARTIES = ['recipient', 'supplier', 'church'];

    public static function record(Equipment $equipment, string $party, ?int $userId = null, ?string $notes = null, ?string $evidencePath = null): ?DeliveryConfirmation
    {
        if (! in_array($party, self::PARTIES, true)) {
            abort(422, "Party must be one of: " . implode(', ', self::PARTIES));
        }

        $confirmation = DeliveryConfirmation::updateOrCreate(
            ['equipment_id' => $equipment->id, 'party' => $party],
            [
                'confirmed_by' => $userId,
                'notes' => $notes,
                'evidence_path' => $evidencePath ?? $equipment->deliveryConfirmations()
                    ->where('party', $party)->value('evidence_path'),
                'confirmed_at' => now(),
            ]
        );

        self::finalizeIfComplete($equipment);

        return $confirmation;
    }

    public static function partiesConfirmed(Equipment $equipment): array
    {
        $existing = DeliveryConfirmation::where('equipment_id', $equipment->id)
            ->pluck('party')
            ->all();

        return array_map(
            fn ($party) => [
                'party' => $party,
                'confirmed' => in_array($party, $existing, true),
            ],
            self::PARTIES
        );
    }

    public static function isComplete(Equipment $equipment): bool
    {
        $confirmed = DeliveryConfirmation::where('equipment_id', $equipment->id)
            ->pluck('party')
            ->all();

        return empty(array_diff(self::PARTIES, $confirmed));
    }

    public static function finalizeIfComplete(Equipment $equipment): void
    {
        if (! self::isComplete($equipment)) {
            return;
        }

        if ($equipment->status !== 'verified') {
            $old = $equipment->status;
            $equipment->update([
                'status' => 'verified',
                'verified_date' => now(),
            ]);

            AuditLog::record('equipment.status_changed', 'Equipment', $equipment->id, $old, 'verified');

            $request = $equipment->item?->request;
            if ($request && $request->applicant_id) {
                AppNotification::create([
                    'user_id' => $request->applicant_id,
                    'type' => 'equipment.verified',
                    'title' => 'Equipment verified',
                    'body' => 'Three-party confirmation is complete for "' . $equipment->model . '". Verified and recorded on the register.',
                    'url' => null,
                ]);
            }
        }

        // Advance the parent request once every item's equipment is verified.
        $request = $equipment->item?->request;
        if (! $request || in_array($request->status, ['delivered', 'active_reporting', 'closed'], true)) {
            return;
        }

        $pending = $request->items()
            ->where(function ($q) {
                $q->whereDoesntHave('equipment')
                    ->whereNotIn('status', ['ordered', 'delivered', 'verified', 'in_use'])
                    ->orWhereHas('equipment', fn ($eq) => $eq->where('status', '!=', 'verified'));
            })
            ->count();

        if ($pending > 0) {
            return;
        }

        if ($request->status === 'procurement') {
            $request->update(['status' => 'delivered']);
            AuditLog::record('request.status_changed', 'FundingRequest', $request->id, 'procurement', 'delivered');
        }
    }
}