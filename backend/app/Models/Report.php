<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Report extends Model
{
    protected $fillable = [
        'item_id',
        'recipient_id',
        'type',
        'due_date',
        'submitted_at',
        'status',
        'content',
        'evidence_path',
        'public_evidence',
        'evidence_approved_by',
        'evidence_approved_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'submitted_at' => 'datetime',
        'public_evidence' => 'boolean',
        'evidence_approved_at' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(RequestItem::class, 'item_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /**
     * Flag reports whose due date has passed without a submission. Runs
     * lazily on list reads; notifications are emitted only on the first
     * transition to avoid spamming users on every fetch.
     */
    public static function markOverdue(): int
    {
        $now = now()->toDateString();
        $count = 0;

        foreach (static::where('status', 'upcoming')
            ->whereNotNull('due_date')
            ->where('due_date', '<', $now)
            ->get() as $report) {
            $report->update(['status' => 'overdue']);
            $count++;

            if ($report->recipient_id) {
                AppNotification::create([
                    'user_id' => $report->recipient_id,
                    'type' => 'report.overdue',
                    'title' => 'Report overdue',
                    'body' => 'Your ' . str_replace('_', ' ', $report->type) . ' report is overdue as of ' . $report->due_date->toDateString() . '. Please submit it as soon as possible.',
                    'url' => null,
                ]);
            }

            AuditLog::record('report.overdue', 'Report', $report->id, 'upcoming', 'overdue');
        }

        return $count;
    }
}
