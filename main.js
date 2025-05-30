import * as THREE from "three";
import gsap from "gsap";


/** 背景画像のパス */
const BG_URL = "./imgs/bg.png";
/** カードの横幅 */
const CARD_WIDTH = 256;
/** カードの縦幅 */
const CARD_HEIGHT = 256;
/** カードのX座標の間隔 */
const CARD_MARGIN = 80;
/** スライドの総数 */
const TOTAL_SLIDES = 44;
/** アニメーションの持続時間 */
const ANIMATION_DURATION = 1.8;
/** 回転アニメーションの持続時間 */
const ROTATION_DURATION = 0.9;
/** アニメーションのイージング */
const ANIMATION_EASE = "expo.out";

/**
 * グローバル変数
 */
/** 現在のスライドID */
let currentPage = 0;
/**
 * 平面を格納する配列
 * @type {Card[]}
 */
const cards = [];

/**
 * シーン、カメラ、レンダラーの初期化
 */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30);
scene.add(camera);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
await renderer.init();
document.body.appendChild(renderer.domElement);

/**
 * UI要素の初期化
 */
const slider = document.querySelector("input#rangeSlider");
slider.addEventListener("input", onSliderChange);

/**
 * タッチ操作の状態管理
 */
let touchStartX = 0;
let touchStartValue = 0;

/**
 * イベントリスナーの設定
 */
window.addEventListener("wheel", onWheel, { passive: false });
renderer.domElement.addEventListener("touchstart", onTouchStart, {
  passive: true,
});
renderer.domElement.addEventListener("touchmove", onTouchMove, {
  passive: false,
});
window.addEventListener("resize", onResize);

/**
 * マウスホイールイベントハンドラー
 * @param {WheelEvent} event - ホイールイベント
 */
function onWheel(event) {
  slider.valueAsNumber += event.deltaY * 0.0005;
  onSliderChange();
  event.preventDefault();
}

/**
 * タッチ開始イベントハンドラー
 * @param {TouchEvent} event - タッチイベント
 */
function onTouchStart(event) {
  if (event.target === slider) return;
  touchStartX = event.touches[0].clientX;
  touchStartValue = slider.valueAsNumber;
}

/**
 * タッチ移動イベントハンドラー
 * @param {TouchEvent} event - タッチイベント
 */
function onTouchMove(event) {
  if (event.target === slider) return;

  const touchX = event.touches[0].clientX;
  const deltaX = touchX - touchStartX;
  const swipeRatio = deltaX / window.innerWidth;

  slider.valueAsNumber = Math.max(
    0,
    Math.min(1, touchStartValue - swipeRatio * 2)
  );
  onSliderChange();

  event.preventDefault();
}

/**
 * スライダー変更イベントハンドラー
 */
function onSliderChange() {
  const nextId = Math.round(slider.valueAsNumber * (TOTAL_SLIDES - 1));
  moveSlide(nextId);
}

/**
 * スライドを移動
 * @param {number} id - 移動先のスライドID
 */
function moveSlide(id) {
  if (currentPage === id) return;

  cards.forEach((card, i) => {
    const {
      x: targetX,
      z: targetZ,
      rotation: targetRot,
    } = calculateCardPosition(i, id);

    gsap.to(card.position, {
      x: targetX,
      z: -1 * targetZ,
      duration: ANIMATION_DURATION,
      ease: ANIMATION_EASE,
      overwrite: true,
    });

    gsap.to(card.rotation, {
      y: targetRot,
      duration: ROTATION_DURATION,
      ease: ANIMATION_EASE,
      overwrite: true,
    });
  });

  currentPage = id;
}

/**
 * カードの位置と回転を計算
 * @param {number} index - カードのインデックス
 * @param {number} targetId - 目標のスライドID
 * @returns {{x: number, z: number, rotation: number}} カードの位置と回転情報
 */
function calculateCardPosition(index, targetId) {
  let targetX = CARD_MARGIN * (index - targetId);
  let targetZ = 0;
  let targetRot = 0;

  if (index < targetId) {
    targetX -= CARD_WIDTH * 0.6;
    targetZ = CARD_WIDTH;
    targetRot = +45 * (Math.PI / 180);
  } else if (index > targetId) {
    targetX += CARD_WIDTH * 0.6;
    targetZ = CARD_WIDTH;
    targetRot = -45 * (Math.PI / 180);
  }

  return { x: targetX, z: targetZ, rotation: targetRot };
}

/**
 * リサイズイベントハンドラー
 */
function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

/**
 * アニメーションループ
 */
function tick() {
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

/**
 * カバーフローのカードクラス
 */
class Card extends THREE.Object3D {
  /**
   * @param {number} index - カードのインデックス
   */
  constructor(index) {
    super();

    const texture = new THREE.TextureLoader().load(`./imgs/${index}.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;

    // 上面
    const material = new THREE.MeshLambertMaterial({ map: texture });
    const planeTop = new THREE.Mesh(
      new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT),
      material
    );
    this.add(planeTop);

    // 反射面
    const materialOpt = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      side: THREE.BackSide,
      opacity: 0.2,
    });
    const planeBottom = new THREE.Mesh(
      new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT),
      materialOpt
    );
    planeBottom.rotation.y = Math.PI;
    planeBottom.rotation.z = Math.PI;
    planeBottom.position.y = -CARD_HEIGHT - 1;
    this.add(planeBottom);
  }
}

/**
 * 初期化処理
 */
async function init() {
  // ライトの設定
  const pointLight = new THREE.PointLight(0xffffff, 1000000, 1000);
  pointLight.position.set(0, 0, 500);
  scene.add(pointLight);

  // カードの生成
  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const card = new Card(i);
    scene.add(card);
    cards[i] = card;
  }

  // カメラの位置設定
  camera.position.z = 900;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // 背景の生成
  const bgTexture = new THREE.TextureLoader().load(BG_URL);
  bgTexture.colorSpace = THREE.SRGBColorSpace;
  const meshBg = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 1000),
    new THREE.MeshBasicMaterial({ map: bgTexture })
  );
  meshBg.position.z = -500;
  scene.add(meshBg);

  // 初期表示
  moveSlide(TOTAL_SLIDES / 2);
  onResize();
  tick();
}

// アプリケーションの開始
init();
