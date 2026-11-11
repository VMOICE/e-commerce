<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(
        Request $request,
        CartService $cartService
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^\p{L}+(?:\s+\p{L}+)*$/u'],
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
            $request->session()->getId()
        );

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Conta criada com sucesso.',
            'user' => $user,
            'cart' => $cartMerge['cart'],
            'warnings' => $cartMerge['warnings'],
        ], 201);
    }

    public function login(
        Request $request,
        CartService $cartService
    ): JsonResponse {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
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
            $request->session()->getId()
        );

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'user' => $user,
            'cart' => $cartMerge['cart'],
            'warnings' => $cartMerge['warnings'],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'regex:/^\p{L}+(?:\s+\p{L}+)*$/u'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($request->user()->id),
            ],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'user' => $request->user()->fresh(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }
}