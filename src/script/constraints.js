/**
 * Jack - 영상 레이턴시 개선
 * P2P 방식 한계로 peer간의 연결 수와 데이터 양이 peer의 증가에 따라 크게 증가함
 * 게임 진행에 필요한 정도의 데이터만 보낼 수 있도록 데이터 양 제한하는 방법 적용
 * 정확하게 계산할 수는 없지만, 비교적 원활한 3명을 기준으로 상대적으로 계산함
 * 데이터양 = (해상도 x framerate) x 인원수 x 2 (up/down이 같다는 가정하에 2배)
 */

const constraints = [
    true, // test - high quality
    { // default
        width: {ideal: 640}, 
        height: {ideal: 360},
        frameRate: {ideal: 30}
    },
    { // 2명
        width: {ideal: 640, max: 640}, 
        height: {ideal: 360, max: 480},
        frameRate: {ideal: 30, max: 30}
    },
    { // 3명
        width: {max: 640}, 
        height: {max: 360},
        frameRate: {max: 27}
    },
    { // 4명
        width: {ideal: 320, max: 352}, 
        height: {ideal: 240, max: 288},
        frameRate: {ideal: 30, max: 30}
    },
    { // 5명
        width: {max: 320}, 
        height: {max: 240},
        frameRate: {ideal: 24, max: 27}
    },
    { // 6명
        width: {max: 320}, 
        height: {max: 240},
        frameRate: {ideal: 21, max: 24}
    },
    { // 7명
        width: {max: 176}, 
        height: {max: 144},
        frameRate: {max: 30}
    },
    { // 8명
        width: {max: 176}, 
        height: {max: 144},
        frameRate: {max: 24}
    }
];

const limits = [
    { // test - high
        maxBitrate: null,
        maxFramerate: 30
    },
    { // default
        maxBitrate: 500 * 1000,
        maxFramerate: 30
    },
    { // 2명
        maxBitrate: 500 * 1000,
        maxFramerate: 30
    },
    { // 3명
        maxBitrate: 500 * 1000,
        maxFramerate: 27
    },
    { // 4명
        maxBitrate: 500 * 1000,
        maxFramerate: 30
    },
    { // 5명
        maxBitrate: 300 * 1000,
        maxFramerate: 27
    },
    { // 6명
        maxBitrate: 270 * 1000,
        maxFramerate: 24
    },
    { // 7명
        maxBitrate: 128 * 1000,
        maxFramerate: 30
    },
    { // 8명
        maxBitrate: 128 * 1000,
        maxFramerate: 24
    }
];
export {constraints, limits};