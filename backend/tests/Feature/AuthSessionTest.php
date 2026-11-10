<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_names_only_accept_letters_and_spaces_on_registration_and_profile_update(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Ana123',
            'email' => 'ana@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/api/me', ['name' => 'Ana123'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_login_authenticates_with_a_session_cookie_without_returning_a_token(): void
    {
        $user = User::factory()->create();
        $origin = 'http://localhost:5173';

        $csrfResponse = $this->withHeader('Origin', $origin)
            ->get('/sanctum/csrf-cookie');
        $csrfToken = urldecode(
            $csrfResponse->getCookie('XSRF-TOKEN', false)->getValue()
        );

        $response = $this->withCookie(
            config('session.cookie'),
            $csrfResponse->getCookie(config('session.cookie'), false)->getValue()
        )
            ->withCookie('XSRF-TOKEN', $csrfToken)
            ->withHeader('X-XSRF-TOKEN', $csrfToken)
            ->withHeader('Origin', $origin)
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertOk()
            ->assertJsonMissingPath('token')
            ->assertCookie(config('session.cookie'));

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_bearer_tokens_cannot_authenticate_api_session_routes(): void
    {
        $this->withHeader('Authorization', 'Bearer legacy-token')
            ->getJson('/api/me')
            ->assertUnauthorized();
    }
}
