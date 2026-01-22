<?php
header('Content-Type: application/json; charset=utf-8');
// http://127.0.0.1:9980/config.php
// ==================
// 1. 生成 sites
// ==================
$dir  = __DIR__;
$self = basename(__FILE__);
$files = scandir($dir);

$sites = [];

foreach ($files as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
        continue;
    }

    if ($file === $self || $file === 'index.php') {
        continue;
    }

    $filename = pathinfo($file, PATHINFO_FILENAME);

    $sites[] = [
        "key"          => "php_" . $filename,
        "name"         => $filename . "(PHP)",
        "type"         => 4,
        "api"          => "http://127.0.0.1:9980/" . $filename . ".php",
        "searchable"   => 1,
        "quickSearch"  => 1,
        "changeable"   => 0
    ];
}

// ==================
// 2. 尝试加载 ../drpy-node/index.json
// ==================
$indexJsonPath = realpath($dir . '/../drpy-node/index.json');

if ($indexJsonPath && is_file($indexJsonPath)) {
    $content = file_get_contents($indexJsonPath);
    $json = json_decode($content, true);

    // JSON 合法并且是数组
    if (is_array($json)) {
        // 替换 sites
        $json['sites'] = $sites;

        echo json_encode(
            $json,
            JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
        );
        exit;
    }
}

// ==================
// 3. 找不到或失败，回退只返回 sites
// ==================
echo json_encode(
    ["sites" => $sites],
    JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
);
