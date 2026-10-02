<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'entity',
        'entity_id',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function record($action, $entity = null, $entityId = null, $old = null, $new = null, $request = null)
    {
        $request = $request ?: request();

        return static::create([
            'user_id' => (auth('sanctum')->user() ?? auth()->user())?->id,
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'old_value' => $old,
            'new_value' => $new,
            'ip_address' => $request ? $request->ip() : null,
            'user_agent' => $request ? substr((string) $request->userAgent(), 0, 255) : null,
        ]);
    }
}
