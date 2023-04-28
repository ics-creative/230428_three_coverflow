import * as THREE from "three";

/** 背景画像 */
const URL_BG = "./imgs/bg.png";

/** 平面の横幅 */
const ITEM_W = 256;
/** スライドの個数 */
const MAX_SLIDE = 44;
/** 平面の縦幅 */
const ITEM_H = 256;
/** 現在のスライドID */
let currentPage = 0;
/** 平面のX座標の間隔 */
const MARGIN_X = 80;

/**
 * 平面を格納する配列
 * @type {Card[]}
 */
const cards = [];

// 3D空間を作成
const scene = new THREE.Scene();

// カメラを作成
const camera = new THREE.PerspectiveCamera();
scene.add(camera);

// レンダラーを作成
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);

// エレメントを追加
document.body.appendChild(renderer.domElement);

// インプット要素の制御
const elementInput = document.querySelector("input#rangeSlider");
elementInput.addEventListener("input", onInputChange);
// elementInput.focus(); // フォーカスを当てるのもヨシ（だが、ICS MEDIAのiframe掲載に不向きだったのでコメントアウト）

// マウスホイール対応
window.addEventListener(
  "wheel",
  (event) => {
    elementInput.valueAsNumber += event.deltaY * 0.0005;
    onInputChange();
    event.preventDefault();
  },
  { passive: false }
);

/**
 * Cover Flow サンプル (Three.js版)
 * @author IKEDA Yasunobu
 */
function init() {
  // ライト
  const pointLight = new THREE.PointLight(0xffffff, 4, 1000);
  pointLight.position.set(0, 0, 500);
  scene.add(pointLight);

  // Planeの作成
  for (let i = 0; i < MAX_SLIDE; i++) {
    // カード
    const card = new Card(i);

    // 3Dシーンに追加
    scene.add(card);

    // 配列に参照の保存
    cards[i] = card;
  }
  //  カメラの位置
  camera.position.z = 900;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // 背景の生成
  const meshBg = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 1000),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(URL_BG),
    })
  );
  meshBg.position.z = -500;
  scene.add(meshBg);

  // 初期のページ表示
  moveSlide(MAX_SLIDE / 2);

  // リサイズ制御
  window.addEventListener("resize", onResize);
  onResize(); // サイズをウインドウにフィットさせる

  // レンダリング
  tick();
}

/**
 * スクロールが動いたときのイベント
 */
function onInputChange() {
  const val = elementInput.valueAsNumber;
  // スクロールバーの値からページIDの計算
  const nextId = Math.round(val * (MAX_SLIDE - 1));
  // ページ遷移
  moveSlide(nextId);
}

/**
 * スライドを移動
 * @param id  {number}  スライドのID
 */
function moveSlide(id) {
  // 遷移先が現在のスライド番号と同じであれば処理を終了
  if (currentPage === id) return;

  for (let i = 0; i < MAX_SLIDE; i++) {
    // 移動値を初期化
    let targetX = 0;
    let targetZ = 0;
    let targetRot = 0;

    // X座標の計算
    targetX = MARGIN_X * (i - id);

    // 中央のスライド画像より左側のもの
    if (i < id) {
      targetX -= ITEM_W * 0.6;
      targetZ = ITEM_W + 10 * (id - i);
      targetRot = +45 * (Math.PI / 180);
    }
    // 中央のスライド画像より右側のもの
    else if (i > id) {
      targetX += ITEM_W * 0.6;
      targetZ = ITEM_W - 10 * (id - i);
      targetRot = -45 * (Math.PI / 180);
    }
    // 中央のスライド画像
    else {
      targetX += 0;
      targetZ = 0;
      targetRot = 0;
    }

    // 対象のカードの参照
    const card = cards[i];

    // タイムラインを作成
    // 上書き可能な指定とする
    const timeline = gsap.timeline({ overwrite: true });

    // 配置座標を指定
    timeline.to(
      card.position,
      { x: targetX, z: -1 * targetZ, duration: 1.8, ease: "expo.out" },
      0
    );

    // 角度を動かす
    timeline.to(
      card.rotation,
      { y: targetRot, duration: 0.9, ease: "expo.out" },
      0
    );
  }

  currentPage = id;
}

/** レイアウト処理(リサイズ対応も兼ねる) */
function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

/** エンターフレームイベント */
function tick() {
  // レンダリング
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

/**
 * カバーフローのカード
 */
class Card extends THREE.Object3D {

  /**
   * @param index {number}
   */
  constructor(index) {
    super();

    const texture = new THREE.TextureLoader().load("./imgs/" + index + ".jpg");

    // 上面

    // マテリアルの作成
    const material = new THREE.MeshLambertMaterial({
      map: texture,
    });

    const planeTop = new THREE.Mesh(
      new THREE.PlaneGeometry(ITEM_W, ITEM_H),
      material
    );
    this.add(planeTop);

    // 反射面
    const materialOpt = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.BackSide,
    });
    materialOpt.opacity = 0.2;
    const planeBottom = new THREE.Mesh(
      new THREE.PlaneGeometry(ITEM_W, ITEM_H),
      materialOpt
    );
    planeBottom.rotation.y = 180 * (Math.PI / 180);
    planeBottom.rotation.z = 180 * (Math.PI / 180);
    planeBottom.position.y = -ITEM_H - 1;
    this.add(planeBottom);
  }
}

// コードを実行

init();
