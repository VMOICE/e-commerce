<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cart_calculates_totals_on_the_server(): void
    {
        $product = $this->createProduct();
        $service = new CartService();
        $cart = $service->resolveCart(null, 'guest-session-test');

        $cart = $service->addItem($cart, $product->id, 2);

        $this->assertSame('20.00', $cart->subtotal);
        $this->assertSame('20.00', $cart->total);
        $this->assertSame('20.00', $cart->items->first()->subtotal);
    }

    public function test_guest_cart_merges_and_quantities_are_capped_by_stock(): void
    {
        $product = $this->createProduct(['stock' => 4]);
        $user = User::factory()->create();
        $service = new CartService();
        $sessionId = 'cart-merge-session';
        $guestCart = $service->resolveCart(null, $sessionId);
        $service->addItem($guestCart, $product->id, 3);

        $userCart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $result = $service->mergeGuestCart($user, $sessionId);

        $this->assertSame(4, $result['cart']->items->first()->quantity);
        $this->assertNotEmpty($result['warnings']);
        $this->assertDatabaseMissing('carts', ['id' => $guestCart->id]);
        $this->assertDatabaseHas('cart_items', [
            'cart_id' => $userCart->id,
            'product_id' => $product->id,
            'quantity' => 4,
        ]);
    }

    private function createProduct(array $overrides = []): Product
    {
        $category = Category::create([
            'name' => 'Categoria teste',
            'slug' => 'categoria-teste-' . uniqid(),
        ]);

        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Produto de teste',
            'slug' => 'produto-teste-' . uniqid(),
            'price' => '10.00',
            'stock' => 5,
            'is_active' => true,
        ], $overrides));
    }
}
