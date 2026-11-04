<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Registra um novo cliente.
     */
    public function register(
        Request $request,
        CartService $cartService
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'customer',
        ]);

        $cartMerge = $cartService->mergeGuestCart(
            $user,
            $request->header('X-Guest-Cart-Token')
        );

        $token = $user->createToken('postman')->plainTextToken;

        return response()->json([
            'message' => 'Conta criada com sucesso.',
            'user' => $user,
            'token' => $token,
            'cart' => $cartMerge['cart'],
            'warnings' => $cartMerge['warnings'],
        ], 201);
    }

    /**
     * Autentica um usuário existente.
     */
    public function login(
        Request $request,
        CartService $cartService
    ): JsonResponse {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (
            !$user ||
            !Hash::check($validated['password'], $user->password)
        ) {
            return response()->json([
                'message' => 'E-mail ou senha inválidos.',
            ], 401);
        }

        $cartMerge = $cartService->mergeGuestCart(
            $user,
            $request->header('X-Guest-Cart-Token')
        );

        $token = $user->createToken('postman')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'user' => $user,
            'token' => $token,
            'cart' => $cartMerge['cart'],
            'warnings' => $cartMerge['warnings'],
        ]);
    }

    /**
     * Retorna o usuário autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Revoga o token utilizado na requisição.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }
}