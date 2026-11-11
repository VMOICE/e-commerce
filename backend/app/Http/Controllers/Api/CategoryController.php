<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

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
            if (! $this->isForeignKeyConstraintViolation($exception)) {
                throw $exception;
            }

            return response()->json([
                'message' => 'Não é possível excluir uma categoria que possui produtos associados.',
            ], 409);
        }

        return response()->json([
            'message' => 'Categoria excluída com sucesso.',
        ]);
    }

    private function isForeignKeyConstraintViolation(QueryException $exception): bool
    {
        $errorInfo = $exception->errorInfo;
        $sqlState = $errorInfo[0] ?? (string) $exception->getCode();
        $driverCode = $errorInfo[1] ?? null;

        return match (DB::connection()->getDriverName()) {
            'pgsql' => $sqlState === '23503',
            'mysql' => $sqlState === '23000' && (int) $driverCode === 1451,
            'sqlite' => $sqlState === '23000'
                && str_contains($exception->getMessage(), 'FOREIGN KEY constraint failed'),
            default => false,
        };
    }
}
