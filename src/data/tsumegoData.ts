import { TsumegoProblem } from '../types/go';

export const INITIAL_TSUMEGO_PROBLEMS: TsumegoProblem[] = [
  // ================= 15k - 10k: 初學入門 (Beginner) =================
  {
    id: 'tsumego-01',
    title: '入門死活：眼形要點做活',
    level: '15k',
    ratingPoints: 600,
    category: 'life',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 2, y: 0 }
      ],
      white: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        { x: 3, y: 1 }, { x: 3, y: 0 }
      ]
    },
    playerColor: 'black',
    description: '黑先活棋。黑棋在角隅被包圍，請找出做成兩隻真眼的絕對急所。',
    hint: '「直三」的眼形，中間一點為要點，佔據即可分出兩隻眼。',
    solutionTree: [
      {
        x: 1,
        y: 0,
        color: 'black',
        isCorrect: true,
        message: '正解！黑佔據 (1,0) 要點，左邊 (0,0) 與右邊形成兩眼，完美做活！'
      },
      {
        x: 0,
        y: 0,
        color: 'black',
        response: {
          x: 1,
          y: 0,
          color: 'white',
          message: '失敗：白點入 (1,0) 破眼，黑棋無法做成兩隻真眼。'
        }
      }
    ],
    commentary: '角隅「直三」形狀，中央即為「敵之要點，即我之要點」。黑1佔據(1,0)後，左右各成一眼，白棋無從破眼。'
  },
  {
    id: 'tsumego-02',
    title: '基礎手筋：妙手「倒撲」破眼殺棋',
    level: '12k',
    ratingPoints: 750,
    category: 'kill',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        { x: 2, y: 1 }, { x: 2, y: 0 }
      ],
      white: [
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 0, y: 1 }
      ]
    },
    playerColor: 'black',
    description: '黑先殺白。白棋角上三子有破綻，請利用「倒撲」手筋將其全殲。',
    hint: '看似將棋子主動送入白棋虎口，實則提回時可以一網打盡！',
    solutionTree: [
      {
        x: 1,
        y: 1,
        color: 'black',
        response: {
          x: 1,
          y: 1,
          color: 'white', // White captures, but then Black recaptures all!
          branches: [
            {
              x: 0,
              y: 1, // Black recaptures
              color: 'black',
              isCorrect: true,
              message: '正解！倒撲大成功，白棋提子後被黑棋全提，順利聚殺！'
            }
          ]
        },
        isCorrect: true,
        message: '正解第一步！大膽將子投進虎口！白棋提子後氣數已盡。'
      }
    ],
    commentary: '黑投子入虎口稱作「倒撲」。白棋提子後僅剩一氣，黑棋反提全滅白子，是基礎殺棋必修手筋。'
  },
  {
    id: 'tsumego-03',
    title: '入門死活：接不歸殲滅白子',
    level: '10k',
    ratingPoints: 900,
    category: 'tesuji',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 5, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 },
        { x: 0, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 },
        { x: 4, y: 1 }, { x: 4, y: 0 }
      ],
      white: [
        { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }
      ]
    },
    playerColor: 'black',
    description: '黑先。白棋三子橫臥中央，黑棋如何利用「接不歸」手筋將白子吃掉？',
    hint: '斷其退路，叫吃後白棋即使連接也會整團被吃。',
    solutionTree: [
      {
        x: 2,
        y: 0,
        color: 'black',
        isCorrect: true,
        message: '正解！黑切斷叫吃，白三子已成「接不歸」，若白連 (2,1) 則黑立刻全提！'
      },
      {
        x: 0,
        y: 2,
        color: 'black',
        message: '失敗：未針對白棋薄弱處攻擊，白棋可搶先防守。'
      }
    ],
    commentary: '黑棋斷於要害，白棋如果黏上反成愚形被一口吞下，稱為接不歸。'
  },

  // ================= 9k - 5k: 級位進階 (Intermediate) =================
  {
    id: 'tsumego-04',
    title: '中級死活：縮小眼界與破眼點',
    level: '8k',
    ratingPoints: 1050,
    category: 'kill',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 5, minY: 0, maxY: 5 },
    initialStones: {
      black: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
        { x: 4, y: 1 }, { x: 4, y: 0 }
      ],
      white: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
        { x: 0, y: 1 }, { x: 3, y: 1 }
      ]
    },
    playerColor: 'black',
    description: '黑先殺白。白棋內部看似眼位寬敞，黑棋先縮小眼界還是直接點眼？',
    hint: '「死活關鍵在邊線扳」——先扳縮小眼界，再破其要點！',
    solutionTree: [
      {
        x: 1,
        y: 1,
        color: 'black',
        response: {
          x: 2,
          y: 1,
          color: 'white',
          branches: [
            {
              x: 2,
              y: 0, // cut/atari
              color: 'black',
              isCorrect: true,
              message: '正解！點中白棋腰部，白棋分成兩團氣短，無法成活！'
            }
          ]
        },
        isCorrect: true,
        message: '正解第一步！點入白棋中央要點，破壞雙眼結構。'
      },
      {
        x: 2,
        y: 1,
        color: 'black',
        response: {
          x: 1,
          y: 1,
          color: 'white',
          message: '白棋佔領另一側，黑棋後續無法殺棋。'
        }
      }
    ],
    commentary: '面對寬廣眼形，切中樞紐點是殺棋首要。'
  },
  {
    id: 'tsumego-05',
    title: '經典形狀：聚殺「刀把五」',
    level: '6k',
    ratingPoints: 1200,
    category: 'kill',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 2 },
        { x: 3, y: 1 }, { x: 3, y: 0 }
      ],
      white: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }
      ]
    },
    playerColor: 'black',
    description: '黑先殺白。角隅白棋內部呈現刀把五的聚殺格局，黑棋第一步應點在何處？',
    hint: '刀把五的核心急所，也是五子中央的心臟位置。',
    solutionTree: [
      {
        x: 1,
        y: 1,
        color: 'black',
        isCorrect: true,
        message: '正解！點中刀把五心臟！白棋無論如何提子，最後皆為假眼或死形。'
      },
      {
        x: 2,
        y: 2,
        color: 'black',
        response: {
          x: 1,
          y: 1,
          color: 'white',
          message: '失敗：被白棋佔據心臟要點，白棋迅速做成兩眼活棋。'
        }
      }
    ],
    commentary: '圍棋名諺「刀把五點眼必死」。中央(1,1)是雙方必爭之點。'
  },
  {
    id: 'tsumego-06',
    title: '實戰手筋：二子頭必扳與緊氣',
    level: '5k',
    ratingPoints: 1300,
    category: 'tesuji',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 5, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 3, y: 1 }
      ],
      white: [
        { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 1, y: 2 }, { x: 2, y: 2 }
      ]
    },
    playerColor: 'black',
    description: '黑先。白棋中央四子氣緊，黑棋如何施展手筋壓制白棋？',
    hint: '「二子頭必扳」，在頭部緊咬白棋氣數！',
    solutionTree: [
      {
        x: 0,
        y: 2,
        color: 'black',
        response: {
          x: 3,
          y: 2,
          color: 'white',
          branches: [
            {
              x: 1,
              y: 3,
              color: 'black',
              isCorrect: true,
              message: '正解！封鎖白棋退路，白棋已無法延氣！'
            }
          ]
        },
        isCorrect: true,
        message: '正解第一步！扳住白棋側翼頭部，造成壓迫。'
      }
    ],
    commentary: '扳頭能有效壓迫對方氣數並奪取發展空間，實戰極為實用。'
  },

  // ================= 4k - 1k: 段位衝刺 (Advanced / Dan Challenger) =================
  {
    id: 'tsumego-07',
    title: '名局死活：角隅「大豬嘴」破殺',
    level: '3k',
    ratingPoints: 1450,
    category: 'kill',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 5, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
        { x: 4, y: 1 }, { x: 4, y: 0 }
      ],
      white: [
        { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
        { x: 0, y: 1 }, { x: 3, y: 1 }
      ]
    },
    playerColor: 'black',
    description: '黑先殺白。角隅名形「大豬嘴」，據傳有「大豬嘴必死」之說，請走出精確殺法。',
    hint: '先立下或先扳？冷靜點眼點在何方？',
    solutionTree: [
      {
        x: 1,
        y: 1,
        color: 'black',
        response: {
          x: 2,
          y: 1,
          color: 'white',
          branches: [
            {
              x: 0,
              y: 0,
              color: 'black',
              isCorrect: true,
              message: '正解！黑佔據角隅一的一，白棋無法補出兩眼，大豬嘴死棋！'
            }
          ]
        },
        isCorrect: true,
        message: '正解第一步！點入腰眼，破壞眼形根基。'
      },
      {
        x: 0,
        y: 0,
        color: 'black',
        response: {
          x: 1,
          y: 1,
          color: 'white',
          message: '失敗：順序錯誤，白棋搶得要點後成活。'
        }
      }
    ],
    commentary: '大豬嘴為角隅經典死活形。黑點入破眼後再行角隅搜根，白棋難逃一死。'
  },
  {
    id: 'tsumego-08',
    title: '妙手手筋：仙鶴抱蛋（鶴之巢）',
    level: '2k',
    ratingPoints: 1550,
    category: 'tesuji',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 6, minY: 0, maxY: 5 },
    initialStones: {
      black: [
        { x: 0, y: 0 }, { x: 4, y: 0 },
        { x: 1, y: 3 }, { x: 3, y: 3 },
        { x: 2, y: 4 }
      ],
      white: [
        { x: 2, y: 1 }, { x: 2, y: 2 }
      ]
    },
    playerColor: 'black',
    description: '黑先。白棋兩子妄圖突破包圍，黑棋施展「仙鶴抱蛋」絕妙枷吃手筋！',
    hint: '不急於貼身叫吃，而是拉開距離進行「虛枷」，宛如仙鶴合翅懷抱鳥蛋。',
    solutionTree: [
      {
        x: 2,
        y: 0,
        color: 'black',
        isCorrect: true,
        message: '正解！仙鶴抱蛋妙手！無論白棋向哪一方衝，黑棋皆可順勢迎頭痛擊！'
      },
      {
        x: 2,
        y: 3,
        color: 'black',
        response: {
          x: 1,
          y: 1,
          color: 'white',
          message: '失敗：貼身過急，白棋順利拐出逃逸。'
        }
      }
    ],
    commentary: '「仙鶴抱蛋」又名鶴之巢，是圍棋最典雅的枷吃手筋之一，行棋瀟灑而封閉縝密。'
  },
  {
    id: 'tsumego-09',
    title: '段位實力：絕處逢生「做劫求活」',
    level: '1k',
    ratingPoints: 1650,
    category: 'ko',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 0 }
      ],
      white: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 1 },
        { x: 3, y: 0 }
      ]
    },
    playerColor: 'black',
    description: '黑先。黑棋淨活無望，但可利用角隅特殊性引發「劫爭」獲取一線生機。',
    hint: '主動製造單眼劫爭，將死局化為半盤博弈！',
    solutionTree: [
      {
        x: 0,
        y: 0,
        color: 'black',
        response: {
          x: 1,
          y: 0,
          color: 'white',
          branches: [
            {
              x: 0,
              y: 0, // fight ko
              color: 'black',
              isCorrect: true,
              message: '正解！成功形成角隅單劫，黑棋通過劫爭有活棋可能！'
            }
          ]
        },
        isCorrect: true,
        message: '正解！搶佔角上一的一引發打劫！'
      }
    ],
    commentary: '在實戰中若無法淨活，「做劫」是最高明的自救策略，迫使對方付出巨大代價。'
  },

  // ================= 1D - 5D: 有段名局 (Dan Level / Master) =================
  {
    id: 'tsumego-10',
    title: '有段名技：神妙「倒脫靴」反殺',
    level: '2D',
    ratingPoints: 1850,
    category: 'tesuji',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 5, minY: 0, maxY: 5 },
    initialStones: {
      black: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 1 },
        { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 0, y: 3 }
      ],
      white: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 3, y: 3 }
      ]
    },
    playerColor: 'black',
    description: '黑先。此形為傳奇手筋「倒脫靴」，甘願被提四子後，回身一擊斬首！',
    hint: '先故意送死形成特定方塊四子，待敵提子後，立即在斷點反提！',
    solutionTree: [
      {
        x: 0,
        y: 0,
        color: 'black',
        response: {
          x: 1,
          y: 0,
          color: 'white',
          branches: [
            {
              x: 0,
              y: 2,
              color: 'black',
              isCorrect: true,
              message: '正解！倒脫靴神技！白棋提去四子後斷點暴露，黑反擊斷殺白棋！'
            }
          ]
        },
        isCorrect: true,
        message: '正解第一步！精準佈局倒脫靴陷阱！'
      }
    ],
    commentary: '「倒脫靴」是圍棋中最具戲劇性的手筋，宛如脫去靴子卻暗藏利刃，令對手猝不及防。'
  },
  {
    id: 'tsumego-11',
    title: '高段死活：巧妙「雙活」和平共處',
    level: '3D',
    ratingPoints: 1950,
    category: 'seki',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 5, minY: 0, maxY: 5 },
    initialStones: {
      black: [
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        { x: 2, y: 1 }, { x: 2, y: 0 }
      ],
      white: [
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 },
        { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 }
      ]
    },
    playerColor: 'black',
    description: '黑先。黑棋無法做成獨立兩眼，但能利用公氣製造「雙活（共活）」全身而退。',
    hint: '不要貪圖吃子，維持雙方公氣互不緊逼！',
    solutionTree: [
      {
        x: 0,
        y: 1,
        color: 'black',
        isCorrect: true,
        message: '正解！黑點在此處形成雙活格局，任何一方動手皆會反被吃，成功求生！'
      },
      {
        x: 1,
        y: 1,
        color: 'black',
        response: {
          x: 0,
          y: 1,
          color: 'white',
          message: '失敗：被白棋搶佔，黑棋氣盡陣亡。'
        }
      }
    ],
    commentary: '雙活是圍棋辯證哲學的極致體現。雙方共用公氣，誰動手誰死，達成戰略制衡。'
  },
  {
    id: 'tsumego-12',
    title: '高段神手：金雞獨立殺法',
    level: '4D',
    ratingPoints: 2100,
    category: 'kill',
    boardSize: 9,
    cropBounds: { minX: 0, maxX: 5, minY: 0, maxY: 4 },
    initialStones: {
      black: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
        { x: 2, y: 2 }
      ],
      white: [
        { x: 1, y: 0 }, { x: 3, y: 0 },
        { x: 0, y: 0 }, { x: 4, y: 0 }
      ]
    },
    playerColor: 'black',
    description: '黑先殺白。黑棋如何走出「金雞獨立」使白棋左右無法叫吃？',
    hint: '冷靜的一「立」，左右兩側皆成禁入點！',
    solutionTree: [
      {
        x: 2,
        y: 0,
        color: 'black',
        isCorrect: true,
        message: '正解！金雞獨立！黑2-0直立中央，白棋左邊叫吃撞氣，右邊叫吃亦撞氣，全滅！'
      }
    ],
    commentary: '黑棋立下後如金雞獨立，白棋兩翼皆因氣緊無法落子，嘆為觀止的幾何奇景。'
  }
];
