<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Shared helper for storing base64 (data URI) documents/photos from clients.
 * Enforces size and MIME allow-list, matching the letter-upload contract.
 */
class MediaStore
{
    public const ALLOWED = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public static function fromBase64($data, string $folder, int $maxBytes = 8 * 1024 * 1024): string
    {
        if (! is_string($data) || $data === '') {
            abort(422, 'No file data provided.');
        }

        $raw = $data;
        $mime = null;

        if (preg_match('/^data:([a-zA-Z0-9.+\-\/]+);base64,(.+)$/', $data, $m)) {
            $mime = strtolower($m[1]);
            $raw = $m[2];
        }

        $contents = base64_decode($raw, true);

        if ($contents === false || strlen($contents) > $maxBytes) {
            abort(422, 'Invalid or too large file (max ' . intdiv($maxBytes, 1024 * 1024) . 'MB).');
        }

        // If no explicit MIME, sniff the bytes for the allow-list types.
        if (! $mime) {
            $mime = self::sniff($contents);
        }

        if (! in_array($mime, array_keys(self::ALLOWED), true)) {
            abort(422, 'Only PDF or image files (JPG/PNG/WebP) are allowed.');
        }

        $ext = self::ALLOWED[$mime];
        $name = $folder . '/' . now()->format('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;

        Storage::disk('public')->put($name, $contents);

        return $name;
    }

    protected static function sniff(string $contents): ?string
    {
        $prefix = substr($contents, 0, 12);

        if (str_starts_with($prefix, '%PDF')) {
            return 'application/pdf';
        }

        $jpg = bin2hex(substr($prefix, 0, 4));
        if (in_array($jpg, ['ffd8ffdb', 'ffd8ffe0', 'ffd8ffe1', 'ffd8ffee'], true)) {
            return 'image/jpeg';
        }

        if (substr($prefix, 0, 8) === "\x89PNG\r\n\x1a\n") {
            return 'image/png';
        }

        if (substr($prefix, 0, 4) === "RIFF" && substr($prefix, 8, 4) === "WEBP") {
            return 'image/webp';
        }

        return null;
    }

    public static function serve(string $path, string $fallbackName = 'file'): \Symfony\Component\HttpFoundation\Response
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            abort(404, 'File not found.');
        }

        $mime = Storage::disk('public')->mimeType($path) ?: 'application/octet-stream';

        return response(Storage::disk('public')->get($path), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $fallbackName . '"',
        ]);
    }

    public static function isPublicImage(?string $path): bool
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return false;
        }

        $mime = Storage::disk('public')->mimeType($path);
        return in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true);
    }

    public static function servePublicImage(string $path): \Symfony\Component\HttpFoundation\Response
    {
        if (! self::isPublicImage($path)) {
            abort(404, 'Public image not found.');
        }

        $mime = Storage::disk('public')->mimeType($path);
        return response(Storage::disk('public')->get($path), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}