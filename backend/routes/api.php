<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminUserController;

// Verificação da API
Route::get('/health', [HealthController::class, 'index']);

// Catálogo público
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show'])
    ->whereNumber('id');

Route::get('/categories', [CategoryController::class, 'index']);

// Autenticação pública
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rotas que exigem autenticação
Route::middleware('auth:web')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Pedidos
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show'])->whereNumber('id');
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{id}/pay', [OrderController::class, 'pay'])->whereNumber('id');
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel'])->whereNumber('id');

    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::patch('/addresses/{id}', [AddressController::class, 'update'])->whereNumber('id');
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy'])->whereNumber('id');
});

// Carrinho
Route::get('/cart', [CartController::class, 'show']);
Route::post('/cart/items', [CartController::class, 'store']);

Route::patch('/cart/items/{productId}', [CartController::class, 'update'])
    ->whereNumber('productId');

Route::delete('/cart/items/{productId}', [CartController::class, 'destroy'])
    ->whereNumber('productId');

Route::delete('/cart', [CartController::class, 'clear']);

// Rotas administrativas
Route::middleware(['auth:web', 'admin'])
    ->prefix('admin')
    ->group(function () {

        // Produtos
        Route::get('/products', [ProductController::class, 'adminIndex']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::patch('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);

        // Categorias
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::patch('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Gerenciamento de pedidos
        Route::get('/orders', [OrderController::class, 'adminIndex']);
        Route::get('/users', [AdminUserController::class, 'index']);

        Route::get('/orders/{id}', [OrderController::class, 'adminShow'])
            ->whereNumber('id');

        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });