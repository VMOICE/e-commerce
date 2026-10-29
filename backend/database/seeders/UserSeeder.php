<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Administrador',
                'email' => 'admin@loja.test',
                'password' => 'Admin123!',
                'role' => 'admin',
            ],
            [
                'name' => 'Cliente Um',
                'email' => 'cliente1@loja.test',
                'password' => 'Cliente123!',
                'role' => 'customer',
            ],
            [
                'name' => 'Cliente Dois',
                'email' => 'cliente2@loja.test',
                'password' => 'Cliente123!',
                'role' => 'customer',
            ],
            [
                'name' => 'Cliente Três',
                'email' => 'cliente3@loja.test',
                'password' => 'Cliente123!',
                'role' => 'customer',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                ]
            );
        }
    }
}