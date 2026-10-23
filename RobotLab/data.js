// ============================================================
//  data.js  –  Robot Lab | Layihə məlumatları
//
//  Yeni layihə əlavə etmək üçün:
//    1. Aşağıdakı şablonu kopyalayın
//    2. Massivdə sonuncu '}' -dən sonra vergül qoyub yapışdırın
//    3. id-ni növbəti rəqəmə dəyişin ("2", "3" və s.)
//    4. Bütün sahələri öz məlumatlarınızla doldurun
//
//  Qeyd: app.js avtomatik olaraq çatışmayan sahələri
//  əvəz edir, lakin hər sahəni doldurmağa çalışın.
// ============================================================

const projects = [
  {
    id: "1",                             // Layihənin nömrəsi (məsələn: "1", "2")
    title: "robot1(test)",              // Ekranda görünəcək ana başlıq
    category: "Arduino",                 // Layihənin növü (Arduino, Python, Mexanika və s.)
    image: "./images/robot1.jpg",     // Şəklin qovluqdakı tam adı
    tags: ["Arduino", "Sınaq", "Mexanika"], // <-- BAX XƏTANI VERƏN ÇATIŞMAYAN SƏTİR BU İDİ!
    shortDesc: "Bu mənim yığdığım ilk sınaq robotudur..",
    description: "Bu robotu Arduino istifadə edərək hazırlamışam. Əsas məqsədim motorları hərəkət etdirməyi öyrənmək idi.",
    features: [
      "İki təkərli hərəkət sistemi",
      "mane tanima ve kamera sistemi"
    ],
    specs: {
      processor: "Arduino Uno",
      sensors:   "mesafe sensoru",
      motors:    "2 dc ",
      power:     "9V Batareya"
    },
    codeSnippet: `// Əgər kod varsa bura yapışdırın. Yoxdursa boş saxlayın.`
  }
];
window.projects = projects;