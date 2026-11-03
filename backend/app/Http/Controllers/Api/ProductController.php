<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(
        Request $request,
        ProductService $productService
    ): JsonResponse {
        $validated = $request->validate([
            'search' => ['sometimes', 'string', 'max:150'],
            'category_id' => ['sometimes', 'integer', 'min:1'],
            'sort' => ['sometimes', 'in:price_asc,price_desc,newest'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $products = $productService->paginateActive($validated);

        return response()->json($products);
    }

    public function show(
        int $id,
        ProductService $productService
    ): JsonResponse {
        $product = $productService->findActiveById($id);

        return response()->json([
            'data' => $product,
        ]);
    }

    public function store(
        Request $request,
        ProductService $productService
    ): JsonResponse {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:180', 'unique:products,slug'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'stock' => ['required', 'integer', 'min:0'],
            'image_path' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $product = $productService->create($validated);

        return response()->json([
            'message' => 'Produto cadastrado com sucesso.',
            'data' => $product,
        ], 201);
    }

    public function update(
        Request $request,
        Product $product,
        ProductService $productService
    ): JsonResponse {
        $validated = $request->validate([
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:150'],
            'slug' => [
                'sometimes',
                'string',
                'max:180',
                Rule::unique('products', 'slug')->ignore($product->id),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'image_path' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $updatedProduct = $productService->update($product, $validated);

        return response()->json([
            'message' => 'Produto atualizado com sucesso.',
            'data' => $updatedProduct,
        ]);
    }

    public function destroy(
        Product $product,
        ProductService $productService
    ): JsonResponse {
        $productService->deactivate($product);

        return response()->json([
            'message' => 'Produto desativado com sucesso.',
        ]);
    }    
}