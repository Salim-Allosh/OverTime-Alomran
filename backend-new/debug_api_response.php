<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\StatisticsController;
use Illuminate\Http\Request;

// Simulate Request for Year 2026
$request = new Request(['year' => 2026]);

$controller = new StatisticsController();
$response = $controller->comprehensive($request);

// echo $response->content();
file_put_contents('response_dump_2.json', $response->content());
echo "Saved to response_dump_2.json";
