<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_search_sort_and_pagination_only_return_active_products(): void
    {
        $category = Category::create([
            'name' => 'Acessórios',
            'slug' => 'acessorios',
        ]);
        Product::create([
            'category_id' => $category->id,
            'name' => 'Cabo Azul',
            'slug' => 'cabo-azul',
            'price' => '12.00',
            'stock' => 3,
            'is_active' => true,
        ]);
        Product::create([
            'category_id' => $category->id,
            'name' => 'Cabo Vermelho',
            'slug' => 'cabo-vermelho',
            'price' => '9.00',
            'stock' => 4,
            'is_active' => true,
        ]);
        $inactiveProduct = Product::create([
            'category_id' => $category->id,
            'name' => 'Cabo Inativo',
            'slug' => 'cabo-inativo',
            'price' => '1.00',
            'stock' => 10,
            'is_active' => false,
        ]);

        $this->getJson('/api/products?search=CABO&sort=price_asc&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Cabo Vermelho')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson("/api/products/{$inactiveProduct->id}")->assertNotFound();
    }
}
