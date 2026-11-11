<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 80)->nullable();
            $table->string('recipient_name', 150);
            $table->string('postal_code', 20);
            $table->string('street', 180);
            $table->string('number', 30);
            $table->string('neighborhood', 120);
            $table->string('city', 120);
            $table->string('state', 80);
            $table->timestamps();

            $table->index(['user_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
