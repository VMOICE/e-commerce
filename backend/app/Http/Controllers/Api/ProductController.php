<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function adminIndex(
        Request $request,
        ProductService $productService
    ): AnonymousResourceCollection {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        return ProductResource::collection(
            $productService->paginateAll($validated)
        );
    }

    public function index(
        Request $request,
        ProductService $productService
    ): AnonymousResourceCollection {
        $validated = $request->validate([
            'search' => ['sometimes', 'string', 'max:150'],
            'category_id' => ['sometimes', 'integer', 'min:1'],
            'sort' => ['sometimes', 'in:price_asc,price_desc,newest'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $products = $productService->paginateActive($validated);

        return ProductResource::collection($products);
    }

    public function show(
        int $id,
        ProductService $productService
    ): ProductResource {
        $product = $productService->findActiveById($id);

        return new ProductResource($product);
    }

    public function store(
        StoreProductRequest $request,
        ProductService $productService
    ): JsonResponse {
        $product = $productService->create($request->validated());

        return response()->json([
            'message' => 'Produto cadastrado com sucesso.',
            'data' => new ProductResource($product),
        ], 201);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product,
        ProductService $productService
    ): JsonResponse {
        $updatedProduct = $productService->update(
            $product,
            $request->validated()
        );

        return response()->json([
            'message' => 'Produto atualizado com sucesso.',
            'data' => new ProductResource($updatedProduct),
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