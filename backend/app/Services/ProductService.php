<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function paginateActive(array $filters): LengthAwarePaginator
    {
        $query = Product::query()
            ->where('is_active', true)
            ->with('category');

        // Pesquisa pelo nome do produto
        if (!empty($filters['search'])) {
            $query->where(
                'name',
                'ilike',
                '%' . $filters['search'] . '%'
            );
        }

        // Filtro por categoria
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Ordenação
        $sort = $filters['sort'] ?? 'newest';

        match ($sort) {
            'price_asc' => $query->orderBy('price')->orderBy('id'),
            'price_desc' => $query->orderByDesc('price')->orderBy('id'),
            default => $query->orderByDesc('created_at')->orderByDesc('id'),
        };

        // Paginação
        return $query->paginate($filters['per_page'] ?? 12);
    }

    public function findActiveById(int $id): Product
    {
        return Product::query()
            ->where('is_active', true)
            ->with('category')
            ->findOrFail($id);
    }

    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            return Product::create($data)->load('category');
        });
    }

    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $product->update($data);

            return $product->refresh()->load('category');
        });
    }

    public function deactivate(Product $product): void
    {
        DB::transaction(function () use ($product) {
            $product->update([
                'is_active' => false,
            ]);
        });
    }
}
