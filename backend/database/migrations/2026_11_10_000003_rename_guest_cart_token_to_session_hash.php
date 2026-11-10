<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropUnique('carts_guest_token_hash_unique');
            $table->renameColumn('guest_token_hash', 'guest_session_hash');
            $table->unique('guest_session_hash');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropUnique('carts_guest_session_hash_unique');
            $table->renameColumn('guest_session_hash', 'guest_token_hash');
            $table->unique('guest_token_hash');
        });
    }
};
