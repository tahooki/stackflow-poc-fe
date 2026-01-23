기능 설명
- 요약
    - Stackflow가 무엇인지 이해한다.
    - Stackflow의 내부 동작방식에 대해서 이해한다.
    - Stackflow의 생성방법, 랜더링 방법, action의 사용법에 대해서 이해한다.

    - Flag패턴이 무엇인지이해한다.
    - Flag패턴의 동작 원리를 이해한다.
    - Flag패턴에 사욥법에 대해서 이해한다.
    - layerManager가 무엇인지 이해한다.
    - LayerManager의 동작 방법을 이해한다.
    - LayerManager의 사용법에 대해 이해한다.

    - BackManager가 무엇인지 이해한다.
    - BackManager의 동작에 대해서 이해한다.
    - BackManager의 사용법에 대해 이해한다.
    
    - 이 4가지가 서로 엮여있는 전체적인 동작 흐름을 이해한다.

- Stackflow
    - Stack처럼 위에서 넣고 위에서 추출해서 관리하는 네비게이션
    - 내부 동작 설명
    - actions의 push, pop, replase, step 등에 대해서 설명
- Flag패턴
    - Stackflow만으로 구현하기 어려운 사용자 모바일 UX를 구현하기 위해서 만든 패턴
    - 동작원리 
        - ex) stackClear -> 모든것을 pop 시킨후 push함 
    - 사용방법
        - push의 params에 추가해서...
- LayerManager
    - 화면에 쌓이는 Layer(모달, 엑션시트, 드로워)들을 Stack처럼 관리 하는 Manager
    - 동작원리
        - 들어온 순서를 토대로 ...
    - 사용방법
        Regist, Unregist ...
- BackManager
    - 뒤로가기에 동작을구현 관리 하는 Manager
    - 사용방법

