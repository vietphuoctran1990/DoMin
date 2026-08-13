/* ============================================================
   CHIẾN SĨ DÒ MÌN - Nội dung: hành trình, trang phục, sticker
   ============================================================ */
(function (global) {
  'use strict';

  /* ============================================================
     HÀNH TRÌNH: 5 vùng, mỗi vùng 3 chặng + 1 trận Sếp Bom
     ============================================================ */
  const ZONES = [
    {
      key: 'meadow', name: 'Cánh Đồng Hoa', icon: '🌼',
      topics: ['count', 'color'], diff: 1,
      boss: { name: 'Sếp Bom Hoa', emoji: '🌺', hp: 5 },
      intro: 'Bãi hoa đầu tiên! Bé đếm và gọi tên màu thật giỏi nhé.'
    },
    {
      key: 'beach', name: 'Bãi Biển Vàng', icon: '🏖️',
      topics: ['math', 'count'], diff: 1,
      boss: { name: 'Sếp Bom Sóng', emoji: '🌊', hp: 5 },
      intro: 'Sóng biển mang mìn tới rồi! Bé tính nhanh lên nào.'
    },
    {
      key: 'forest', name: 'Rừng Xanh Bí Ẩn', icon: '🌲',
      topics: ['animal', 'shape', 'letter'], diff: 2,
      boss: { name: 'Sếp Bom Rừng', emoji: '🦁', hp: 6 },
      intro: 'Trong rừng có nhiều bạn thú. Bé nhận ra hết không?'
    },
    {
      key: 'snow', name: 'Đỉnh Núi Tuyết', icon: '❄️',
      topics: ['riddle', 'math', 'life'], diff: 2,
      boss: { name: 'Sếp Bom Băng', emoji: '🧊', hp: 6 },
      intro: 'Lạnh quá! Bé giải câu đố cho ấm người nào.'
    },
    {
      key: 'space', name: 'Hành Tinh Lạ', icon: '🚀',
      topics: ['mix'], diff: 3,
      boss: { name: 'Sếp Bom Vũ Trụ', emoji: '👾', hp: 7 },
      intro: 'Chặng cuối cùng! Chiến sĩ nhí thể hiện hết tài đi nào.'
    }
  ];

  const NODES_PER_ZONE = 4;          /* 3 chặng thường + 1 boss */
  const QUESTIONS_PER_NODE = 8;

  /* ============================================================
     VÙNG ĐẤT BÍ ẨN - chế độ vô tận, mở sau khi hạ trùm cuối
     ============================================================ */
  const ENDLESS = {
    name: 'Vùng Đất Bí Ẩn',
    icon: '🌌',
    hearts: 3,
    terrainEvery: 4,        /* cứ 4 câu đúng lại sang cảnh mới */
    diffUpEvery: 6,         /* cứ 6 câu đúng lại khó hơn một bậc */
    starEvery: 4,           /* cứ đi được 4 chặng thì thưởng 1 sao */
    intro: 'Đi được càng xa càng giỏi! Sai 3 lần là phải quay về nhé.'
  };

  /* Vị trí các chặng trên bản đồ (% khung bản đồ):
     đường đi zigzag từ dưới trái leo dần lên trên phải */
  const NODE_SPOTS = [
    { x: 18, y: 84 }, { x: 54, y: 70 }, { x: 27, y: 45 }, { x: 72, y: 26 }
  ];

  /* ============================================================
     TỦ ĐỒ - mua bằng ⭐ sao bé kiếm được
     ============================================================ */
  const CAPS = [
    { id: 'cap_army', name: 'Mũ bộ đội', icon: '🪖', price: 0 },
    { id: 'cap_taibeo', name: 'Mũ tai bèo', icon: '👒', price: 4 },
    { id: 'cap_party', name: 'Mũ sinh nhật', icon: '🎉', price: 7 },
    { id: 'cap_space', name: 'Mũ phi hành gia', icon: '🧑‍🚀', price: 12 },
    { id: 'cap_crown', name: 'Vương miện', icon: '👑', price: 16 }
  ];

  const UNIFORMS = [
    { id: 'uni_green', name: 'Xanh bộ đội', icon: '🟩', price: 0,
      c1: '#8cc16a', c2: '#5d8f42', c3: '#a8d98a', c4: '#4e7a35', arm: '#7fb85e', leg: '#4c7a37' },
    { id: 'uni_blue', name: 'Xanh hải quân', icon: '🟦', price: 5,
      c1: '#7ec4f5', c2: '#3d7fbf', c3: '#b3e0ff', c4: '#356fa8', arm: '#6fb6ee', leg: '#33689e' },
    { id: 'uni_sand', name: 'Cam sa mạc', icon: '🟧', price: 5,
      c1: '#ffc47a', c2: '#e08a3c', c3: '#ffe0b3', c4: '#c9762f', arm: '#ffb765', leg: '#c06f2c' },
    { id: 'uni_pink', name: 'Hồng kẹo ngọt', icon: '🩷', price: 9,
      c1: '#ffb0cd', c2: '#f2739f', c3: '#ffd6e6', c4: '#dd5b89', arm: '#ffa3c4', leg: '#d9527f' },
    { id: 'uni_purple', name: 'Tím vũ trụ', icon: '🟪', price: 12,
      c1: '#c9a7ff', c2: '#8b5cf6', c3: '#e2d3ff', c4: '#7c4ded', arm: '#bd97ff', leg: '#6d3fd6' }
  ];

  const ACCESSORIES = [
    { id: 'acc_none', name: 'Không đeo', icon: '🚫', price: 0 },
    { id: 'acc_scarf', name: 'Khăn quàng đỏ', icon: '🧣', price: 3 },
    { id: 'acc_backpack', name: 'Ba lô', icon: '🎒', price: 6 },
    { id: 'acc_glasses', name: 'Kính râm', icon: '🕶️', price: 9 },
    { id: 'acc_wings', name: 'Đôi cánh', icon: '🪽', price: 14 }
  ];

  const PETS = [
    { id: 'pet_none', name: 'Chưa có bạn', icon: '🚫', price: 0, emoji: '' },
    { id: 'pet_dog', name: 'Cún Mực', icon: '🐶', price: 6, emoji: '🐶' },
    { id: 'pet_cat', name: 'Mèo Mun', icon: '🐱', price: 6, emoji: '🐱' },
    { id: 'pet_chick', name: 'Gà Bông', icon: '🐥', price: 8, emoji: '🐥' },
    { id: 'pet_penguin', name: 'Cánh Cụt', icon: '🐧', price: 10, emoji: '🐧' },
    { id: 'pet_robot', name: 'Rô Bốt', icon: '🤖', price: 13, emoji: '🤖' }
  ];

  const SLOTS = [
    { key: 'cap', name: 'Mũ', icon: '🪖', list: CAPS },
    { key: 'uni', name: 'Quân phục', icon: '👕', list: UNIFORMS },
    { key: 'acc', name: 'Phụ kiện', icon: '🎒', list: ACCESSORIES },
    { key: 'pet', name: 'Thú cưng', icon: '🐾', list: PETS }
  ];

  function findItem(id) {
    for (const s of SLOTS) {
      const it = s.list.find(x => x.id === id);
      if (it) return it;
    }
    return null;
  }

  /* ============================================================
     ALBUM STICKER - mỗi chặng xong tặng 1 sticker mới
     ============================================================ */
  const STICKERS = [
    { id: 'st_bee', e: '🐝', n: 'Ong Chăm Chỉ' },
    { id: 'st_lady', e: '🐞', n: 'Bọ Rùa Đỏ' },
    { id: 'st_fox', e: '🦊', n: 'Cáo Tinh Nghịch' },
    { id: 'st_owl', e: '🦉', n: 'Cú Thông Thái' },
    { id: 'st_turtle', e: '🐢', n: 'Rùa Chậm Rãi' },
    { id: 'st_whale', e: '🐳', n: 'Cá Voi Xanh' },
    { id: 'st_crab', e: '🦀', n: 'Cua Càng To' },
    { id: 'st_star', e: '⭐', n: 'Ngôi Sao Sáng' },
    { id: 'st_rainbow', e: '🌈', n: 'Cầu Vồng' },
    { id: 'st_sun', e: '🌞', n: 'Mặt Trời Cười' },
    { id: 'st_moon', e: '🌙', n: 'Trăng Lưỡi Liềm' },
    { id: 'st_cloud', e: '⛅', n: 'Mây Bồng Bềnh' },
    { id: 'st_cake', e: '🧁', n: 'Bánh Kem Nhỏ' },
    { id: 'st_candy', e: '🍬', n: 'Kẹo Ngọt' },
    { id: 'st_ice', e: '🍦', n: 'Kem Mát Lạnh' },
    { id: 'st_ball', e: '⚽', n: 'Quả Bóng' },
    { id: 'st_kite', e: '🪁', n: 'Cánh Diều' },
    { id: 'st_rocket', e: '🚀', n: 'Tên Lửa' },
    { id: 'st_ufo', e: '🛸', n: 'Đĩa Bay' },
    { id: 'st_planet', e: '🪐', n: 'Hành Tinh Vòng' },
    { id: 'st_snow', e: '⛄', n: 'Người Tuyết' },
    { id: 'st_tree', e: '🌳', n: 'Cây Cổ Thụ' },
    { id: 'st_mushroom', e: '🍄', n: 'Nấm Đỏ' },
    { id: 'st_medal', e: '🏅', n: 'Huy Chương Vàng' }
  ];

  /* Sticker riêng cho mỗi trận thắng Sếp Bom */
  const BOSS_STICKERS = ['st_medal', 'st_whale', 'st_owl', 'st_snow', 'st_planet'];

  global.Content = {
    ZONES, NODES_PER_ZONE, QUESTIONS_PER_NODE, NODE_SPOTS, ENDLESS,
    CAPS, UNIFORMS, ACCESSORIES, PETS, SLOTS, findItem,
    STICKERS, BOSS_STICKERS,
    uniform: id => UNIFORMS.find(u => u.id === id) || UNIFORMS[0],
    pet: id => PETS.find(p => p.id === id) || PETS[0],
    sticker: id => STICKERS.find(s => s.id === id) || null,
    nodeId: (z, n) => z + '-' + n
  };
})(window);
