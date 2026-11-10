<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_freezes_price_and_address_and_payment_is_simulated(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $product = $this->createProduct();
        $address = $this->createAddress($user);
        $this->addToCart($user, $product, 2);

        $this->actingAs($user)
            ->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.total', '20.00')
            ->assertJsonPath('data.items.0.product_name', $product->name)
            ->assertJsonPath('data.shipping_address.street', 'Rua Teste');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 3,
        ]);
        $this->assertDatabaseCount('cart_items', 0);

        $order = Order::firstOrFail();
        $product->update(['price' => '99.00', 'name' => 'Nome atualizado']);

        $this->postJson("/api/orders/{$order->id}/pay")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.items.0.product_name', 'Produto de teste')
            ->assertJsonPath('data.items.0.unit_price', '10.00');

        $this->assertNotNull($order->fresh()->paid_at);
    }

    public function test_customer_cannot_cancel_paid_order_and_invalid_transition_returns_conflict(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        $order = Order::create([
            'user_id' => $user->id,
            'status' => 'paid',
            'subtotal' => '10.00',
            'shipping_cost' => '0.00',
            'total' => '10.00',
        ]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(409);

        $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'delivered',
            ])
            ->assertStatus(409);

        $this->assertSame('paid', $order->fresh()->status);
    }

    public function test_users_cannot_use_another_users_order_or_address(): void
    {
        /** @var User $owner */
        $owner = User::factory()->create();
        /** @var User $otherUser */
        $otherUser = User::factory()->create();
        $order = Order::create([
            'user_id' => $owner->id,
            'status' => 'pending',
            'subtotal' => '10.00',
            'shipping_cost' => '0.00',
            'total' => '10.00',
        ]);
        $address = $this->createAddress($owner);

        $this->actingAs($otherUser)
            ->postJson("/api/orders/{$order->id}/pay")
            ->assertForbidden();

        $this->getJson('/api/addresses')->assertOk()->assertJsonCount(0, 'data');
        $this->patchJson("/api/addresses/{$address->id}", ['city' => 'Alterada'])
            ->assertNotFound();

        $this->assertSame('pending', $order->fresh()->status);
        $this->assertSame('São Paulo', $address->fresh()->city);
    }

    public function test_cancelling_pending_order_restores_stock(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 3]);
        $address = $this->createAddress($user);
        $this->addToCart($user, $product, 2);

        $this->actingAs($user)
            ->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated();

        $order = Order::firstOrFail();
        $this->postJson("/api/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 3,
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

    private function createAddress(User $user): Address
    {
        return $user->addresses()->create([
            'recipient_name' => $user->name,
            'postal_code' => '00000-000',
            'street' => 'Rua Teste',
            'number' => '10',
            'neighborhood' => 'Centro',
            'city' => 'São Paulo',
            'state' => 'SP',
        ]);
    }

    private function addToCart(User $user, Product $product, int $quantity): void
    {
        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
        ]);
    }
}
