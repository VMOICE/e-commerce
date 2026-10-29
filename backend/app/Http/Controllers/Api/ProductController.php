<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'string', 'max:150'],
            'category_id' => ['sometimes', 'integer', 'min:1'],
            'sort' => ['sometimes', 'in:price_asc,price_desc,newest'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Product::query()
            ->where('is_active', true)
            ->with('category');

        if (!empty($validated['search'])) {
            $query->where(
                'name',
                'ilike',
                '%' . $validated['search'] . '%'
            );
        }

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        $sort = $validated['sort'] ?? 'newest';

        match ($sort) {
            'price_asc' => $query->orderBy('price')->orderBy('id'),
            'price_desc' => $query->orderByDesc('price')->orderBy('id'),
            default => $query->orderByDesc('created_at')->orderByDesc('id'),
        };

        $products = $query->paginate(
            $validated['per_page'] ?? 12
        );

        return response()->json($products);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::query()
            ->where('is_active', true)
            ->with('category')
            ->findOrFail($id);

        return response()->json([
            'data' => $product,
        ]);
    }
}