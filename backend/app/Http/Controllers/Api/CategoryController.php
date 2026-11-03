<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(
        CategoryService $categoryService
    ): JsonResponse {
        $categories = $categoryService->getAllWithActiveProductCount();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function store(
        Request $request,
        CategoryService $categoryService
    ): JsonResponse {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:categories,name'],
            'slug' => ['required', 'string', 'max:120', 'unique:categories,slug'],
            'description' => ['nullable', 'string'],
        ]);

        $category = $categoryService->create($data);

        return response()->json([
            'message' => 'Categoria criada com sucesso.',
            'data' => $category,
        ], 201);
    }

    public function update(
        Request $request,
        Category $category,
        CategoryService $categoryService
    ): JsonResponse {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('categories', 'name')->ignore($category->id)],
            'slug' => ['sometimes', 'required', 'string', 'max:120', Rule::unique('categories', 'slug')->ignore($category->id)],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $category = $categoryService->update($category, $data);

        return response()->json([
            'message' => 'Categoria atualizada com sucesso.',
            'data' => $category,
        ]);
    }

    public function destroy(
        Category $category,
        CategoryService $categoryService
    ): JsonResponse {
        try {
            $categoryService->delete($category);
        } catch (\Illuminate\Database\QueryException $exception) {
            return response()->json([
                'message' => 'Não é possível excluir uma categoria que possui produtos associados.',
            ], 409);
        }

        return response()->json([
            'message' => 'Categoria excluída com sucesso.',
        ]);
    }
}