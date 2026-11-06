import { AssessmentQuestion } from '../types/go';

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // 1. 基礎死活 (Tsumego - 12k)
  {
    id: 'as-01',
    title: '死活要點：角隅直三作活',
    category: 'tsumego',
    difficulty: '12k',
    targetDanPoints: 750,
    questionText: '黑先。黑棋三顆子在角上被白棋團團包圍，此時黑棋最關鍵的作活急所是哪一點？',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }
      ],
      white: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 }
      ]
    },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: 'A 點 (1, 0) —— 直三正中央',
        point: { x: 1, y: 0 },
        explanation: '正確！「直三」眼形中央為做活急所，黑棋落此可分出兩隻真眼。',
        isCorrect: true,
      },
      {
        id: 'B',
        label: 'B 點 (0, 0) —— 角上一的一',
        point: { x: 0, y: 0 },
        explanation: '錯誤！若走 (0,0)，白棋立刻搶佔 (1,0) 破眼，黑棋無法做成兩隻真眼。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: 'C 點 (1, 2) —— 衝擊白棋外圍',
        point: { x: 1, y: 2 },
        explanation: '錯誤！該點已有白子，且向外衝突無法解決眼形危機。',
        isCorrect: false,
      }
    ]
  },

  // 2. 基本手筋 (Tesuji - 9k)
  {
    id: 'as-02',
    title: '基礎手筋：倒撲捉子',
    category: 'tesuji',
    difficulty: '9k',
    targetDanPoints: 1000,
    questionText: '黑先。白棋三子成愚形且氣緊，黑棋應如何利用「倒撲」手筋一舉擒獲白子？',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 0 }
      ],
      white: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }
      ]
    },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: 'A 點 (1, 1) —— 投子入虎口進行倒撲',
        point: { x: 1, y: 1 },
        explanation: '正確！黑下在 (1,1) 看似送吃，但白提子後只剩一氣，黑立刻反提全滅白棋！',
        isCorrect: true,
      },
      {
        id: 'B',
        label: 'B 點 (0, 1) —— 直接叫吃',
        point: { x: 0, y: 1 },
        explanation: '錯誤！該點已有白子，無法在此落子。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: 'C 點 (0, 3) —— 外圍飛',
        point: { x: 0, y: 3 },
        explanation: '錯誤！脫離戰場，白棋補一手即可活出。',
        isCorrect: false,
      }
    ]
  },

  // 3. 棋形常識 (Shape - 7k)
  {
    id: 'as-03',
    title: '棋形判斷：愚形之戒與好形',
    category: 'shape',
    difficulty: '7k',
    targetDanPoints: 1150,
    questionText: '圍棋古諺云：「寧失一子，莫走愚形」。下列哪一種形狀在通常情況下是效率最低、最易造成氣短的「大愚形」？',
    boardSize: 9,
    initialStones: { black: [], white: [] },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '愚形三角（空三角，三個子貼緊呈直角卻無護衛）',
        explanation: '正確！空三角沒有護衛任何交叉點，氣數比正常少且毫無效率，為圍棋大忌。',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '雙（竹節，兩個平行二子相連無懈可擊）',
        explanation: '錯誤！雙是非常堅固、不可切斷的好形。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '虎口（三子環抱一空點，威脅敵子）',
        explanation: '錯誤！虎口能蓄勢並保有豐富眼位，為優良形狀。',
        isCorrect: false,
      },
      {
        id: 'D',
        label: '飛（小飛，兼顧速度與連繫）',
        explanation: '錯誤！小飛是佈局與行棋中最常見的高效好形。',
        isCorrect: false,
      }
    ]
  },

  // 4. 官子計算 (Endgame - 5k)
  {
    id: 'as-04',
    title: '官子理論：先手官子與後手價值',
    category: 'endgame',
    difficulty: '5k',
    targetDanPoints: 1300,
    questionText: '進入官子階段時，棋盤上有三個點可選：A處為「雙方後手8目」，B處為「雙方先手3目」，C處為「我方先手4目」。在正常情況下，應優先搶佔哪一種官子？',
    boardSize: 9,
    initialStones: { black: [], white: [] },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '優先下「雙方先手官子」或「我方絕對先手官子」',
        explanation: '正確！先手官子不浪費手數（下完對手必須應，依然是我方提子行棋），幾乎等同「免費」得目，若被對手搶到則損失翻倍！',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '直接搶最大目數的後手8目，忽略先手',
        explanation: '錯誤！若直接下後手，對手搶走所有先手官子後再收其他官子，總損失遠大於8目。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '先手後手沒有區別，目數越多越好',
        explanation: '錯誤！官子次序的真諦在於「先走雙方先手、再走我方先手、後走逆先手與後手」。',
        isCorrect: false,
      }
    ]
  },

  // 5. 大局觀 (Strategy - 3k)
  {
    id: 'as-05',
    title: '大局判斷：金角銀邊草肚皮與急所先行',
    category: 'strategy',
    difficulty: '3k',
    targetDanPoints: 1450,
    questionText: '開局佈局階段，兩位棋手在爭奪勢力範圍。下列哪一項戰略原則最符合高段棋手的大局觀判斷？',
    boardSize: 19,
    initialStones: { black: [], white: [] },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '「有急先搶急，無急再搶大」——孤棋安危重於單純圍地',
        explanation: '正確！大局觀的最高原則是「急所大於大場」。若己方有弱棋未安，圍再大的地也會被反攻致死；若敵方有弱棋，必先攻其要害。',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '開局第一手立刻佔據天元，並全力在中腹圍大空',
        explanation: '錯誤！俗諺「金角銀邊草肚皮」，中央圍空效率最低，防守線路四通八達極難成地。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '對手每下一子，無論下在哪裡都必須貼身近戰扭十字',
        explanation: '錯誤！這是盲目隨手，容易被對手借勁整形或行雲流水展開大局。',
        isCorrect: false,
      }
    ]
  },

  // 6. 高級手筋 (Tesuji - 1k)
  {
    id: 'as-06',
    title: '衝段手筋：仙鶴抱蛋枷吃',
    category: 'tesuji',
    difficulty: '1k',
    targetDanPoints: 1650,
    questionText: '黑先。白棋兩顆逃亡子欲向外衝撞，黑棋如何利用著名的「仙鶴抱蛋」手筋完成精妙枷吃？',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 1, y: 3 }, { x: 3, y: 3 }
      ],
      white: [
        { x: 2, y: 1 }, { x: 2, y: 2 }
      ]
    },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '在 (2, 0) 虛枷（如仙鶴合翅）',
        point: { x: 2, y: 0 },
        explanation: '正確！這是經典的仙鶴抱蛋。白棋衝哪一邊黑就擋哪一邊，完美封殺！',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '在 (2, 3) 貼身叫吃',
        point: { x: 2, y: 3 },
        explanation: '錯誤！貼身叫吃反而激發白棋拐出，黑棋封閉線出現裂痕導致白棋逃脫。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '在 (1, 1) 點刺',
        point: { x: 1, y: 1 },
        explanation: '錯誤！方向不對，白棋順利長出。',
        isCorrect: false,
      }
    ]
  },

  // 7. 段位死活 (Tsumego - 1D)
  {
    id: 'as-07',
    title: '業餘一段鑑定：角隅大豬嘴死活判定',
    category: 'tsumego',
    difficulty: '1D',
    targetDanPoints: 1800,
    questionText: '關於圍棋角隅極具代表性的「大豬嘴」死活問題，在雙方最精準著手的前提下，其結論通常為何？',
    boardSize: 9,
    initialStones: { black: [], white: [] },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '「大豬嘴，扳點死」——攻擊方若走對次序，被包圍方淨死',
        explanation: '正確！「小豬嘴做劫，大豬嘴淨死」。攻擊方精準點入要害與立下搜根，大豬嘴無法成活。',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '大豬嘴為無條件活棋，不可殺',
        explanation: '錯誤！若攻擊方走對，大豬嘴是無法淨活的。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '必定形成雙活（共活）',
        explanation: '錯誤！大豬嘴內部無足夠公氣，無法成立雙活。',
        isCorrect: false,
      }
    ]
  },

  // 8. 高段哲學與手筋 (Tesuji - 2D)
  {
    id: 'as-08',
    title: '高段死活：神技「倒脫靴」機制',
    category: 'tesuji',
    difficulty: '2D',
    targetDanPoints: 1950,
    questionText: '圍棋中最神奇的手筋之一「倒脫靴」，其核心戰術機制是什麼？',
    boardSize: 9,
    initialStones: { black: [], white: [] },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '先主動犧牲自己特定的四子（如方四或曲四），待敵方提子後立即在原斷點反提回敵子',
        explanation: '正確！這正是「倒脫靴」的精髓。故意讓對方提掉四子，但在其提子留下的大片空地中，原有的斷點暴露無遺，隨即回敬致命一擊反提敵子！',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '利用打劫連續找劫材，將對方全部劫材耗盡',
        explanation: '錯誤！那是劫爭戰略，並非倒脫靴。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '在二路連續爬行，逼迫對方圍中腹',
        explanation: '錯誤！二路連續爬行俗稱地溝流或送目，不是倒脫靴手筋。',
        isCorrect: false,
      }
    ]
  },

  // 9. 大局觀與定式 (Strategy - 3D)
  {
    id: 'as-09',
    title: '高段大局觀：厚勢發揮之真諦',
    category: 'strategy',
    difficulty: '3D',
    targetDanPoints: 2100,
    questionText: '圍棋經典棋理「厚勢不可用來圍空」，其真正的內涵與正確運用厚勢的方針是什麼？',
    boardSize: 19,
    initialStones: { black: [], white: [] },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '厚勢的威力在於威懾與進攻——逼迫對手進入自己勢力範圍，以厚勢為後盾發動獵殺或掠奪官子',
        explanation: '正確！厚勢本身若拿來圍地，每顆子折算目數極低；但若用厚勢逼迫對方孤棋戰鬥，可借攻擊之威在其他處順手牽羊大獲全勝。',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '厚勢必須在第一時間緊貼圍成實地，防止對方侵入',
        explanation: '錯誤！這正是棋理警告的錯誤打法，效率低下。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '有厚勢的一方應當四處棄子，避免任何接觸戰',
        explanation: '錯誤！厚勢就是戰鬥的最大本錢，畏懼戰鬥則厚勢形同虛設。',
        isCorrect: false,
      }
    ]
  },

  // 10. 終局與特異死活 (Tsumego - 4D)
  {
    id: 'as-10',
    title: '高段規則與特殊死活：盤角曲四判定',
    category: 'tsumego',
    difficulty: '4D',
    targetDanPoints: 2250,
    questionText: '在中日韓傳統圍棋規則中，關於角隅著名的「盤角曲四」死活判定，公認的終局判定結論為何？',
    boardSize: 9,
    initialStones: { black: [], white: [] },
    playerColor: 'black',
    options: [
      {
        id: 'A',
        label: '「盤角曲四，劫盡棋亡」——攻擊方可消盡全盤劫材後再行點殺，故實質為死棋',
        explanation: '正確！盤角曲四因角隅特性，外部無劫材時進攻方可以在最後關頭提子做劫，被攻方無法找劫材，因此在傳統日韓規則中直接判定為死棋。',
        isCorrect: true,
      },
      {
        id: 'B',
        label: '雙方無條件雙活，不可點殺',
        explanation: '錯誤！盤角曲四並非雙活，攻擊方有主動權發動致死點殺。',
        isCorrect: false,
      },
      {
        id: 'C',
        label: '盤角曲四無條件活棋',
        explanation: '錯誤！這是初學者常有的誤解。',
        isCorrect: false,
      }
    ]
  }
];
