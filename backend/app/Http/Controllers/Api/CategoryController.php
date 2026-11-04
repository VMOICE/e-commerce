<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\QueryException;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function index(
        CategoryService $categoryService
    ): AnonymousResourceCollection {
        $categories = $categoryService->getAllWithActiveProductCount();

        return CategoryResource::collection($categories);
    }

    public function store(
        StoreCategoryRequest $request,
        CategoryService $categoryService
    ): JsonResponse {
        $category = $categoryService->create($request->validated());

        return response()->json([
            'message' => 'Categoria criada com sucesso.',
            'data' => new CategoryResource($category),
        ], 201);
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category,
        CategoryService $categoryService
    ): JsonResponse {
        $updatedCategory = $categoryService->update(
            $category,
            $request->validated()
        );

        return response()->json([
            'message' => 'Categoria atualizada com sucesso.',
            'data' => new CategoryResource($updatedCategory),
        ]);
    }

    public function destroy(
        Category $category,
        CategoryService $categoryService
    ): JsonResponse {
        try {
            $categoryService->delete($category);
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Não é possível excluir uma categoria que possui produtos associados.',
            ], 409);
        }

        return response()->json([
            'message' => 'Categoria excluída com sucesso.',
        ]);
    }
}