<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {

        $this->call(UserSeeder::class);
        
        /*
        |--------------------------------------------------------------------------
        | Categorias
        |--------------------------------------------------------------------------
        */

        $categories = [
            [
                'name' => 'Capas e Proteção',
                'slug' => 'capas-e-protecao',
                'description' => 'Capas, películas e acessórios para proteger celulares.',
            ],
            [
                'name' => 'Carregadores e Cabos',
                'slug' => 'carregadores-e-cabos',
                'description' => 'Carregadores, cabos, adaptadores e acessórios de energia.',
            ],
            [
                'name' => 'Áudio e Acessórios',
                'slug' => 'audio-e-acessorios',
                'description' => 'Fones, suportes, power banks e outros acessórios para celular.',
            ],
        ];

        foreach ($categories as $categoryData) {
            Category::updateOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Produtos
        |--------------------------------------------------------------------------
        |
        | Preços representados como strings decimais.
        | 30 produtos distribuídos entre as três categorias.
        |
        */

        $products = [
            // =========================================================
            // CAPAS E PROTEÇÃO — 10 produtos
            // =========================================================

            [
                'category' => 'capas-e-protecao',
                'name' => 'Capa Transparente para Smartphone',
                'slug' => 'capa-transparente-smartphone',
                'description' => 'Capa transparente para proteção contra riscos e pequenos impactos.',
                'price' => '24.90',
                'stock' => 30,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Capa Antichoque Reforçada',
                'slug' => 'capa-antichoque-reforcada',
                'description' => 'Capa com bordas reforçadas para ajudar a proteger o celular contra impactos.',
                'price' => '39.90',
                'stock' => 20,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Capa Silicone Preta',
                'slug' => 'capa-silicone-preta',
                'description' => 'Capa de silicone com acabamento preto.',
                'price' => '29.90',
                'stock' => 25,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Capa Carteira para Celular',
                'slug' => 'capa-carteira-celular',
                'description' => 'Capa com compartimentos para cartões.',
                'price' => '49.90',
                'stock' => 12,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Película de Vidro Temperado',
                'slug' => 'pelicula-vidro-temperado',
                'description' => 'Película de vidro temperado para proteção da tela.',
                'price' => '19.90',
                'stock' => 40,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Película de Privacidade',
                'slug' => 'pelicula-privacidade',
                'description' => 'Película que reduz o ângulo de visão lateral da tela.',
                'price' => '34.90',
                'stock' => 15,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Película para Câmera',
                'slug' => 'pelicula-protetora-camera',
                'description' => 'Proteção adicional para as lentes da câmera traseira.',
                'price' => '14.90',
                'stock' => 22,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Capa com Suporte Integrado',
                'slug' => 'capa-suporte-integrado',
                'description' => 'Capa com suporte traseiro para facilitar o uso do celular.',
                'price' => '44.90',
                'stock' => 10,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Capa Antichoque Azul',
                'slug' => 'capa-antichoque-azul',
                'description' => 'Capa azul com estrutura reforçada.',
                'price' => '34.90',
                'stock' => 0,
                'is_active' => true,
            ],
            [
                'category' => 'capas-e-protecao',
                'name' => 'Capa Premium Magnética',
                'slug' => 'capa-premium-magnetica',
                'description' => 'Capa premium com sistema magnético para acessórios compatíveis.',
                'price' => '79.90',
                'stock' => 8,
                'is_active' => false,
            ],

            // =========================================================
            // CARREGADORES E CABOS — 10 produtos
            // =========================================================

            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Carregador USB-C 20 W',
                'slug' => 'carregador-usbc-20w',
                'description' => 'Carregador USB-C de 20 W para dispositivos compatíveis.',
                'price' => '59.90',
                'stock' => 18,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Carregador USB-C 30 W',
                'slug' => 'carregador-usbc-30w',
                'description' => 'Carregador de 30 W para celulares e outros dispositivos compatíveis.',
                'price' => '89.90',
                'stock' => 12,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Cabo USB-C para USB-C',
                'slug' => 'cabo-usbc-usbc',
                'description' => 'Cabo USB-C para USB-C para carregamento e transferência de dados.',
                'price' => '29.90',
                'stock' => 35,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Cabo USB-A para USB-C',
                'slug' => 'cabo-usba-usbc',
                'description' => 'Cabo USB-A para USB-C para dispositivos compatíveis.',
                'price' => '19.90',
                'stock' => 28,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Cabo USB-C para Lightning',
                'slug' => 'cabo-usbc-lightning',
                'description' => 'Cabo USB-C para Lightning para dispositivos compatíveis.',
                'price' => '39.90',
                'stock' => 14,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Carregador Veicular USB-C',
                'slug' => 'carregador-veicular-usbc',
                'description' => 'Carregador para utilizar na tomada de energia do veículo.',
                'price' => '49.90',
                'stock' => 11,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Adaptador USB-C para P2',
                'slug' => 'adaptador-usbc-p2',
                'description' => 'Adaptador de áudio para aparelhos compatíveis.',
                'price' => '24.90',
                'stock' => 16,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Carregador Sem Fio',
                'slug' => 'carregador-sem-fio',
                'description' => 'Base de carregamento sem fio para celulares compatíveis.',
                'price' => '99.90',
                'stock' => 7,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Power Bank 10000 mAh',
                'slug' => 'power-bank-10000mah',
                'description' => 'Bateria externa portátil de 10000 mAh.',
                'price' => '119.90',
                'stock' => 9,
                'is_active' => true,
            ],
            [
                'category' => 'carregadores-e-cabos',
                'name' => 'Power Bank 20000 mAh',
                'slug' => 'power-bank-20000mah',
                'description' => 'Bateria externa portátil de 20000 mAh.',
                'price' => '179.90',
                'stock' => 6,
                'is_active' => true,
            ],

            // =========================================================
            // ÁUDIO E ACESSÓRIOS — 10 produtos
            // =========================================================

            [
                'category' => 'audio-e-acessorios',
                'name' => 'Fone Bluetooth',
                'slug' => 'fone-bluetooth',
                'description' => 'Fone de ouvido sem fio para dispositivos compatíveis.',
                'price' => '89.90',
                'stock' => 15,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Fone Bluetooth com Estojo',
                'slug' => 'fone-bluetooth-estojo',
                'description' => 'Fone sem fio com estojo para armazenamento e recarga.',
                'price' => '149.90',
                'stock' => 10,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Fone de Ouvido com Fio',
                'slug' => 'fone-ouvido-com-fio',
                'description' => 'Fone de ouvido com fio para dispositivos compatíveis.',
                'price' => '34.90',
                'stock' => 24,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Suporte Veicular para Celular',
                'slug' => 'suporte-veicular-celular',
                'description' => 'Suporte para fixação do celular no veículo.',
                'price' => '39.90',
                'stock' => 13,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Suporte de Mesa para Celular',
                'slug' => 'suporte-mesa-celular',
                'description' => 'Suporte de mesa ajustável para celular.',
                'price' => '29.90',
                'stock' => 17,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Anel de Suporte para Celular',
                'slug' => 'anel-suporte-celular',
                'description' => 'Acessório traseiro para auxiliar na pegada do celular.',
                'price' => '14.90',
                'stock' => 26,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Tripé para Smartphone',
                'slug' => 'tripe-smartphone',
                'description' => 'Tripé compacto para fotografias e gravações.',
                'price' => '69.90',
                'stock' => 8,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Bastão de Selfie Bluetooth',
                'slug' => 'bastao-selfie-bluetooth',
                'description' => 'Bastão de selfie com controle Bluetooth.',
                'price' => '54.90',
                'stock' => 11,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Microfone de Lapela USB-C',
                'slug' => 'microfone-lapela-usbc',
                'description' => 'Microfone compacto para gravações em dispositivos compatíveis.',
                'price' => '79.90',
                'stock' => 5,
                'is_active' => true,
            ],
            [
                'category' => 'audio-e-acessorios',
                'name' => 'Luz LED para Selfie',
                'slug' => 'luz-led-selfie',
                'description' => 'Iluminador compacto para fotografias e vídeos.',
                'price' => '32.90',
                'stock' => 19,
                'is_active' => true,
            ],
        ];

        foreach ($products as $productData) {
            $category = Category::where(
                'slug',
                $productData['category']
            )->firstOrFail();

            unset($productData['category']);

            Product::updateOrCreate(
                ['slug' => $productData['slug']],
                array_merge($productData, [
                    'category_id' => $category->id,
                ])
            );
        }
    }
}