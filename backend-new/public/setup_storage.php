<?php

$targetFolder = realpath(__DIR__ . '/../storage/app/public');
$linkFolder = __DIR__ . '/storage';

echo "<div style='font-family: Arial, sans-serif; text-align: center; margin-top: 50px;'>";
echo "<h2>إعداد روابط مجلد الرفع (Storage Link)</h2>";

if (!$targetFolder) {
    echo "<p style='color:red'>خطأ: تعذر العثور على مجلد التخزين الرئيسي. تأكد من أنك قمت برفع هذا الملف داخل مجلد <b>public</b> الخاص بمشروع Laravel.</p>";
    exit;
}

if (file_exists($linkFolder)) {
    if (is_link($linkFolder)) {
        echo "<p style='color:orange'>ملاحظة: الرابط الرمزي (Symlink) موجود مسبقاً. جاري حذفه وإعادة إنشائه...</p>";
        unlink($linkFolder);
    } else {
        echo "<p style='color:red'>خطأ: يوجد مجلد باسم <b>storage</b> داخل المجلد public وهو ليس اختصاراً (symlink). يرجى حذفه يدوياً من cPanel لتتمكن من إنشاء الرابط.</p>";
        echo "</div>";
        exit;
    }
}

try {
    if (symlink($targetFolder, $linkFolder)) {
        echo "<p style='color:green; font-weight: bold; font-size: 18px;'>تم بنجاح! تم ربط مجلد التخزين، يجب أن تعمل الشهادات الآن بدون مشاكل.</p>";
    } else {
        echo "<p style='color:red'>فشل إنشاء الرابط الرمزي. قد تكون دالة symlink() معطلة من قبل استضافتك لأسباب أمنية.</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red'>خطأ برمجي: " . $e->getMessage() . "</p>";
}

echo "<p style='margin-top: 30px; font-size: 14px; color: #666;'>يرجى مسح هذا الملف (setup_storage.php) من السيرفر بعد الانتهاء لدواعي أمنية.</p>";
echo "</div>";
