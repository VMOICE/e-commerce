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

    public function test_guest_cart_uses_the_frontend_session_and_server_calculates_totals(): void
    {
        $product = $this->createProduct();
        $service = new CartService();
        $sessionId = 'guest-session-test';
        $cart = $service->resolveCart(null, $sessionId);

        $this->assertSame(hash('sha256', $sessionId), $cart->guest_session_hash);
        $this->assertSame(
            $cart->id,
            $service->resolveCart(null, $sessionId)->id
        );
        $this->assertNotSame(
            $cart->id,
            $service->resolveCart(null, 'another-session')->id
        );

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

    public function test_cart_endpoint_returns_and_reuses_the_session_cookie(): void
    {
        $origin = 'http://localhost:5173';
        $firstResponse = $this->withCredentials()
            ->withHeader('Origin', $origin)
            ->getJson('/api/cart');

        $firstResponse->assertOk()
            ->assertJsonMissingPath('guest_token')
            ->assertCookie(config('session.cookie'));

        $cartId = $firstResponse->json('data.id');
        $sessionCookie = $firstResponse->getCookie(config('session.cookie'));

        $this->assertNotNull($sessionCookie);

        $secondResponse = $this->withHeader('Origin', $origin)
            ->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->getJson('/api/cart');

        $secondResponse->assertOk()
            ->assertJsonPath('data.id', $cartId);

        $this->assertDatabaseCount('carts', 1);
        $this->assertDatabaseHas('carts', ['id' => $cartId]);
    }

    public function test_guest_cart_is_merged_on_login_using_the_session_cookie(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct();
        $origin = 'http://localhost:5173';

        $csrfResponse = $this->withCredentials()
            ->withHeader('Origin', $origin)
            ->get('/sanctum/csrf-cookie');
        $sessionId = $csrfResponse->getCookie(config('session.cookie'))->getValue();
        $csrfToken = urldecode(
            $csrfResponse->getCookie('XSRF-TOKEN', false)->getValue()
        );

        $cartResponse = $this->withCookie(config('session.cookie'), $sessionId)
            ->withHeader('Origin', $origin)
            ->getJson('/api/cart')
            ->assertOk();
        $guestCartId = $cartResponse->json('data.id');

        $guestCart = app(CartService::class)->resolveCart(null, $sessionId);
        $this->assertSame($guestCartId, $guestCart->id);
        app(CartService::class)->addItem($guestCart, $product->id, 2);

        $loginResponse = $this->withCookie('XSRF-TOKEN', $csrfToken)
            ->withHeader('X-XSRF-TOKEN', $csrfToken)
            ->withHeader('Origin', $origin)
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $loginResponse->assertOk()
            ->assertJsonPath('cart.items.0.product_id', $product->id)
            ->assertJsonPath('cart.items.0.quantity', 2);
        $this->assertDatabaseMissing('carts', ['id' => $guestCartId]);
        $this->assertDatabaseHas('carts', ['user_id' => $user->id]);
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
