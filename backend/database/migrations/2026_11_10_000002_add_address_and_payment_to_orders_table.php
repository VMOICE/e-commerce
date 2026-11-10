<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('address_id')
                ->nullable()
                ->after('user_id')
                ->constrained('addresses')
                ->nullOnDelete();
            $table->json('shipping_address')->nullable()->after('address_id');
            $table->timestamp('paid_at')->nullable()->after('total');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('address_id');
            $table->dropColumn(['shipping_address', 'paid_at']);
        });
    }
};
