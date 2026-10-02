<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query()
            ->when($request->q, fn ($q) => $q->where('name', 'like', "%{$request->q}%"))
            ->orderBy('name');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'region' => 'nullable|string|max:255',
        ]);

        $supplier = Supplier::create([
            'name' => $request->name,
            'contact_person' => $request->contact_person,
            'contact_phone' => $request->contact_phone,
            'contact_email' => $request->contact_email,
            'region' => $request->region,
            'verification_status' => 'pending',
        ]);

        \App\Models\AuditLog::record('supplier.created', 'Supplier', $supplier->id, null, $supplier->toArray());

        return response()->json($supplier, 201);
    }

    public function verify(Supplier $supplier)
    {
        $supplier->update(['verification_status' => 'verified']);
        \App\Models\AuditLog::record('supplier.verified', 'Supplier', $supplier->id);

        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'region' => 'nullable|string|max:255',
        ]);

        $old = $supplier->toArray();
        $supplier->update($request->only(['name', 'contact_person', 'contact_phone', 'contact_email', 'region']));
        \App\Models\AuditLog::record('supplier.updated', 'Supplier', $supplier->id, $old, $supplier->toArray());

        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        \App\Models\AuditLog::record('supplier.deleted', 'Supplier', $supplier->id);

        return response()->json(['message' => 'Deleted.']);
    }
}
