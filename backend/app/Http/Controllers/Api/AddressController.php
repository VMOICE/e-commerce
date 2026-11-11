<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->addresses()->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:80'],
            'recipient_name' => ['required', 'string', 'max:150'],
            'postal_code' => ['required', 'string', 'regex:/^[0-9]{5}-[0-9]{3}$/'],
            'street' => ['required', 'string', 'max:180'],
            'number' => ['required', 'string', 'max:30'],
            'neighborhood' => ['required', 'string', 'max:120'],
            'city' => ['required', 'string', 'max:120'],
            'state' => ['required', 'string', 'max:80'],
        ]);

        $address = $request->user()->addresses()->create($validated);

        return response()->json([
            'message' => 'Endereço cadastrado com sucesso.',
            'data' => $address,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $validated = $request->validate([
            'label' => ['sometimes', 'nullable', 'string', 'max:80'],
            'recipient_name' => ['sometimes', 'required', 'string', 'max:150'],
            'postal_code' => ['sometimes', 'required', 'string', 'regex:/^[0-9]{5}-[0-9]{3}$/'],
            'street' => ['sometimes', 'required', 'string', 'max:180'],
            'number' => ['sometimes', 'required', 'string', 'max:30'],
            'neighborhood' => ['sometimes', 'required', 'string', 'max:120'],
            'city' => ['sometimes', 'required', 'string', 'max:120'],
            'state' => ['sometimes', 'required', 'string', 'max:80'],
        ]);
        $address->update($validated);

        return response()->json([
            'message' => 'Endereço atualizado com sucesso.',
            'data' => $address->refresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->addresses()->findOrFail($id)->delete();

        return response()->json([
            'message' => 'Endereço removido com sucesso.',
        ]);
    }
}
