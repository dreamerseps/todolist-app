# 프론트엔드 스타일 가이드 - TodoListApp

**작성일:** 2026-05-14  
**버전:** 1.1  
**참고:** Bordio 스타일 — 사이드바 기반 레이아웃, 컬러 카드, 미니멀 UI

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2026-05-14 | yoseb lee | 최초 작성 |
| 1.1 | 2026-05-14 | yoseb lee | 다크모드 CSS 변수 팔레트 섹션 추가 (섹션 13) |

---

## 1. 디자인 원칙

- **밀도(Density):** 정보를 컴팩트하게 배치. 스크롤 최소화
- **색으로 구분:** 카테고리별 파스텔 컬러 카드로 시각적 구분
- **일관성:** 동일한 컴포넌트는 동일한 간격·색·반경 적용
- **계층 명확화:** 사이드바 > 헤더 > 콘텐츠 영역의 깊이감 유지

---

## 2. 컬러 팔레트

### 2.1 브랜드 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-primary` | `#3D7BF5` | 주요 버튼, 활성 탭 언더라인, 로고 |
| `--color-primary-hover` | `#2B68E0` | 버튼 hover 상태 |
| `--color-primary-light` | `#EBF1FE` | 활성 사이드바 항목 배경 |

### 2.2 중립 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-bg-page` | `#F4F5F7` | 페이지 전체 배경 |
| `--color-bg-surface` | `#FFFFFF` | 카드, 패널, 모달 배경 |
| `--color-bg-sidebar` | `#FFFFFF` | 사이드바 배경 |
| `--color-border` | `#E5E7EB` | 구분선, 입력 필드 테두리 |
| `--color-border-strong` | `#D1D5DB` | 강조 구분선 |

### 2.3 텍스트 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-text-primary` | `#111827` | 제목, 주요 텍스트 |
| `--color-text-secondary` | `#6B7280` | 부제, 메타 정보 |
| `--color-text-tertiary` | `#9CA3AF` | 비활성, placeholder |
| `--color-text-on-primary` | `#FFFFFF` | 파란 배경 위 텍스트 |

### 2.4 카테고리 카드 컬러 (파스텔)

카테고리별 색상 코딩으로 시각적 구분.

| 토큰 | Hex | 카테고리 예시 |
|------|-----|--------------|
| `--color-category-1` | `#D1FAE5` | 업무 (배경) |
| `--color-category-1-text` | `#065F46` | 업무 (텍스트) |
| `--color-category-2` | `#DBEAFE` | 개인 (배경) |
| `--color-category-2-text` | `#1E40AF` | 개인 (텍스트) |
| `--color-category-3` | `#FEF3C7` | 기타 (배경) |
| `--color-category-3-text` | `#92400E` | 기타 (텍스트) |
| `--color-category-4` | `#FCE7F3` | 사용자 정의 4번 (배경) |
| `--color-category-4-text` | `#9D174D` | 사용자 정의 4번 (텍스트) |
| `--color-category-5` | `#EDE9FE` | 사용자 정의 5번 (배경) |
| `--color-category-5-text` | `#5B21B6` | 사용자 정의 5번 (텍스트) |

> 카테고리가 6개 이상이면 index % 5 로 순환 할당.

### 2.5 상태 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-success` | `#10B981` | 완료 상태, 성공 토스트 |
| `--color-success-light` | `#D1FAE5` | 완료 배지 배경 |
| `--color-warning` | `#F59E0B` | 마감 임박 (D-1) |
| `--color-warning-light` | `#FEF3C7` | 마감 임박 배지 배경 |
| `--color-danger` | `#EF4444` | 삭제 버튼, 에러 |
| `--color-danger-light` | `#FEE2E2` | 에러 배지 배경 |

---

## 3. 타이포그래피

**기본 폰트:** `Inter`, `Pretendard`, `-apple-system`, `sans-serif`

```css
font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 3.1 스케일

| 토큰 | Size | Weight | Line-height | 용도 |
|------|------|--------|-------------|------|
| `--text-xs` | 11px | 400 | 1.4 | 타임스탬프, 배지 |
| `--text-sm` | 12px | 400 | 1.5 | 사이드바 메뉴, 메타 정보 |
| `--text-base` | 13px | 400 | 1.6 | 본문, 할일 제목 |
| `--text-md` | 14px | 500 | 1.5 | 카드 헤더, 폼 레이블 |
| `--text-lg` | 16px | 600 | 1.4 | 섹션 헤더 |
| `--text-xl` | 18px | 700 | 1.3 | 페이지 제목 |

> 전체 UI가 컴팩트하므로 기본 본문 크기를 13px로 유지한다.

---

## 4. 간격 (Spacing)

4px 기본 단위.

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--space-1` | 4px | 아이콘-텍스트 간격 |
| `--space-2` | 8px | 카드 내부 패딩, 배지 |
| `--space-3` | 12px | 섹션 내부 패딩 |
| `--space-4` | 16px | 카드 패딩, 컴포넌트 간 기본 간격 |
| `--space-5` | 20px | 섹션 간 간격 |
| `--space-6` | 24px | 페이지 패딩 |
| `--space-8` | 32px | 큰 섹션 간격 |

---

## 5. 보더 반경 (Border Radius)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--radius-sm` | 4px | 배지, 태그 |
| `--radius-md` | 6px | 버튼, 입력 필드 |
| `--radius-lg` | 8px | 카드, 드롭다운 |
| `--radius-xl` | 12px | 모달, 패널 |
| `--radius-full` | 9999px | 아바타, 토글, 원형 버튼 |

---

## 6. 그림자 (Shadow)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | 카드 기본 상태 |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.10)` | 드롭다운, hover 카드 |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | 모달, 토스트 |

---

## 7. 레이아웃

### 7.1 전체 구조

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content Area       │
│                   │  ┌──────────────────────┐│
│  Logo             │  │ Header Toolbar       ││
│  ──────────────   │  ├──────────────────────┤│
│  Navigation       │  │                      ││
│    Workspace      │  │ Content              ││
│    Favorites      │  │ (Todo List / Grid)   ││
│    Projects       │  │                      ││
│    Settings       │  └──────────────────────┘│
└─────────────────────────────────────────────┘
```

### 7.2 사이드바

| 속성 | 값 |
|------|-----|
| 너비 | 240px (펼침) / 0px (접힘) |
| 배경 | `--color-bg-sidebar` |
| 우측 경계 | `1px solid --color-border` |
| 최소 높이 | 100vh |
| 전환 애니메이션 | `transition: width 200ms ease` |

**사이드바 항목 상태:**

```
기본:     color: --color-text-secondary, bg: transparent
hover:    bg: --color-bg-page, color: --color-text-primary
활성:     bg: --color-primary-light, color: --color-primary, font-weight: 500
```

**섹션 구조:**
- Logo (32px 높이)
- 검색창
- 메뉴 그룹 (접기/펼치기 가능, `▾` 아이콘)
- 그룹 내 메뉴 항목 (들여쓰기 12px)

### 7.3 헤더 툴바

| 속성 | 값 |
|------|-----|
| 높이 | 52px |
| 배경 | `--color-bg-surface` |
| 하단 경계 | `1px solid --color-border` |
| 패딩 | `0 24px` |
| 정렬 | `display: flex; align-items: center; gap: 8px` |

구성 요소 (좌 → 우):
1. `+ Add new` 주요 액션 버튼
2. View 선택 드롭다운 (리스트 / 보드)
3. 필터 버튼
4. 구분선 `|`
5. 우측 정렬: 검색, 알림, 아바타

---

## 8. 컴포넌트

### 8.1 버튼

#### Primary Button
```css
background: var(--color-primary);
color: var(--color-text-on-primary);
border-radius: var(--radius-md);
padding: 7px 14px;
font-size: var(--text-md);
font-weight: 500;
border: none;
cursor: pointer;
transition: background 150ms;
```
Hover: `background: var(--color-primary-hover)`

#### Secondary Button (Ghost)
```css
background: transparent;
color: var(--color-text-secondary);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
padding: 6px 12px;
font-size: var(--text-sm);
```
Hover: `background: var(--color-bg-page)`

#### Icon Button (툴바 내)
```css
width: 32px; height: 32px;
border-radius: var(--radius-md);
background: transparent;
border: none;
color: var(--color-text-secondary);
```
Hover: `background: var(--color-bg-page)`

#### FAB (모바일 — 우하단 고정)
```css
width: 52px; height: 52px;
border-radius: var(--radius-full);
background: var(--color-primary);
color: white;
font-size: 24px;
box-shadow: var(--shadow-md);
position: fixed; right: 20px; bottom: 80px;
```

### 8.2 할일 카드

카테고리 색상에 따라 배경색이 달라지는 컴팩트 카드.

```
┌──────────────────────────────────────┐
│ [카테고리 배지]   제목               │  ← 13px, font-weight: 500
│ 설명 (생략)...                       │  ← 12px, color: secondary
│ 📅 2026-05-20   ⏱ 0:20h             │  ← 11px, color: tertiary
└──────────────────────────────────────┘
```

```css
.todo-card {
  background: var(--card-bg);        /* 카테고리 컬러 */
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  margin-bottom: 6px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 150ms, transform 150ms;
  cursor: pointer;
}
.todo-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.todo-card.completed {
  opacity: 0.6;
}
.todo-card.completed .todo-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}
```

**완료 체크박스:** 카드 좌측 16×16 원형 체크박스. 완료 시 `--color-success` 배경.

### 8.3 카테고리 배지

```css
.category-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  background: var(--badge-bg);    /* 카테고리 배경 컬러 */
  color: var(--badge-text);       /* 카테고리 텍스트 컬러 */
}
```

### 8.4 입력 필드

```css
.input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
  outline: none;
  transition: border-color 150ms;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(61, 123, 245, 0.15);
}
.input::placeholder {
  color: var(--color-text-tertiary);
}
.input.error {
  border-color: var(--color-danger);
}
```

### 8.5 드롭다운 / Select

```css
.select {
  /* input과 동일 기본 스타일 */
  appearance: none;
  background-image: url("chevron-down.svg");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
  cursor: pointer;
}
```

### 8.6 모달

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  width: 480px;
  max-width: calc(100vw - 32px);
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
  font-size: var(--text-lg);
  font-weight: 600;
}
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  margin-top: 24px;
}
```

### 8.7 토스트 알림

```css
.toast {
  position: fixed; bottom: 24px; right: 24px;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  z-index: 200;
  animation: slide-in-up 200ms ease;
}
.toast.success { border-left: 3px solid var(--color-success); }
.toast.error   { border-left: 3px solid var(--color-danger); }
.toast.warning { border-left: 3px solid var(--color-warning); }
```

### 8.8 사이드바 메뉴 항목

```css
.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 120ms, color 120ms;
  user-select: none;
}
.nav-item:hover {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}
.nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}
.nav-section-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  padding: 12px 12px 4px;
}
```

### 8.9 필터 바

헤더 툴바 아래 조건부 표시.

```css
.filter-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 24px;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.filter-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 10px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
}
.filter-chip .remove-btn {
  width: 14px; height: 14px;
  cursor: pointer;
  opacity: 0.7;
}
```

### 8.10 빈 상태 (Empty State)

```
    (아이콘 — 회색 60px)
     할일이 없습니다
   + 새 할일 추가하기 버튼
```

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 64px 24px;
  color: var(--color-text-tertiary);
  text-align: center;
  gap: 12px;
}
.empty-state-icon { font-size: 48px; opacity: 0.4; }
.empty-state-title { font-size: var(--text-md); font-weight: 500; }
```

---

## 9. 아이콘

**라이브러리:** [Lucide React](https://lucide.dev) — 선 굵기 1.5px, 사이즈 일관성 유지.

| 용도 | 아이콘 |
|------|--------|
| 할일 추가 | `Plus` |
| 할일 완료 | `CheckCircle2` |
| 삭제 | `Trash2` |
| 수정 | `Pencil` |
| 카테고리 | `Tag` |
| 마감일 | `CalendarDays` |
| 필터 | `SlidersHorizontal` |
| 검색 | `Search` |
| 로그아웃 | `LogOut` |
| 프로필 | `UserCircle` |
| 사이드바 접기 | `ChevronsLeft` |
| 메뉴 더보기 | `MoreHorizontal` |
| 알림 | `Bell` |
| 설정 | `Settings` |

**크기 규칙:**
- 툴바 아이콘: 16px
- 사이드바 메뉴 아이콘: 14px
- 카드 내 아이콘: 12px
- FAB 아이콘: 24px

---

## 10. 반응형 브레이크포인트

| 이름 | 범위 | 레이아웃 |
|------|------|---------|
| mobile | ~ 767px | 사이드바 숨김, 하단 네비게이션 바 표시, FAB 버튼 |
| tablet | 768px ~ 1023px | 사이드바 아이콘 전용(60px) |
| desktop | 1024px ~ | 사이드바 전체 표시(240px) |

### 모바일 하단 네비게이션 바

```css
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 60px;
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
  display: flex; justify-content: space-around; align-items: center;
  z-index: 50;
}
.bottom-nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  font-size: 10px;
  color: var(--color-text-tertiary);
}
.bottom-nav-item.active {
  color: var(--color-primary);
}
```

---

## 11. 애니메이션

| 용도 | 속성 | 값 |
|------|------|----|
| 버튼 hover | `transition` | `150ms ease` |
| 사이드바 토글 | `transition` | `width 200ms ease` |
| 카드 hover | `transition` | `box-shadow 150ms, transform 150ms` |
| 모달 진입 | `animation` | `fade-in 180ms ease` |
| 토스트 진입 | `animation` | `slide-in-up 200ms ease` |
| 드롭다운 | `animation` | `fade-in 120ms ease` |

```css
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes slide-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 12. CSS 변수 전체 선언 예시

```css
:root {
  /* Brand */
  --color-primary:        #3D7BF5;
  --color-primary-hover:  #2B68E0;
  --color-primary-light:  #EBF1FE;

  /* Background */
  --color-bg-page:        #F4F5F7;
  --color-bg-surface:     #FFFFFF;
  --color-bg-sidebar:     #FFFFFF;

  /* Border */
  --color-border:         #E5E7EB;
  --color-border-strong:  #D1D5DB;

  /* Text */
  --color-text-primary:   #111827;
  --color-text-secondary: #6B7280;
  --color-text-tertiary:  #9CA3AF;
  --color-text-on-primary:#FFFFFF;

  /* Status */
  --color-success:        #10B981;
  --color-success-light:  #D1FAE5;
  --color-warning:        #F59E0B;
  --color-warning-light:  #FEF3C7;
  --color-danger:         #EF4444;
  --color-danger-light:   #FEE2E2;

  /* Category cards */
  --color-category-1:      #D1FAE5;
  --color-category-1-text: #065F46;
  --color-category-2:      #DBEAFE;
  --color-category-2-text: #1E40AF;
  --color-category-3:      #FEF3C7;
  --color-category-3-text: #92400E;
  --color-category-4:      #FCE7F3;
  --color-category-4-text: #9D174D;
  --color-category-5:      #EDE9FE;
  --color-category-5-text: #5B21B6;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radius */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);

  /* Typography */
  --text-xs:   11px;
  --text-sm:   12px;
  --text-base: 13px;
  --text-md:   14px;
  --text-lg:   16px;
  --text-xl:   18px;
}
```

---

## 13. 다크 모드

테마는 `html` 요소의 `data-theme` 속성으로 제어된다. `settingsStore`의 `setTheme()`이 `document.documentElement.setAttribute('data-theme', theme)`를 호출하여 적용한다.

### 13.1 다크 모드 CSS 변수

```css
html[data-theme="dark"] {
  /* Brand */
  --color-primary:        #5B9CF6;
  --color-primary-hover:  #4A8AE8;
  --color-primary-light:  #1E2D4A;

  /* Background */
  --color-bg-page:        #0F1117;
  --color-bg-surface:     #1A1D27;
  --color-bg-sidebar:     #1A1D27;

  /* Border */
  --color-border:         #2E3140;
  --color-border-strong:  #3D4155;

  /* Text */
  --color-text-primary:   #F3F4F6;
  --color-text-secondary: #9CA3AF;
  --color-text-tertiary:  #6B7280;
  --color-text-on-primary:#FFFFFF;

  /* Status */
  --color-success:        #34D399;
  --color-success-light:  #064E3B;
  --color-warning:        #FBBF24;
  --color-warning-light:  #451A03;
  --color-danger:         #F87171;
  --color-danger-light:   #450A0A;

  /* Category cards (다크 모드에서 채도 낮춤) */
  --color-category-1:      #064E3B;
  --color-category-1-text: #6EE7B7;
  --color-category-2:      #1E3A5F;
  --color-category-2-text: #93C5FD;
  --color-category-3:      #451A03;
  --color-category-3-text: #FCD34D;
  --color-category-4:      #500724;
  --color-category-4-text: #F9A8D4;
  --color-category-5:      #2E1065;
  --color-category-5-text: #C4B5FD;

  /* Shadow (다크 모드에서 더 진하게) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.30);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.40);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.50);
}
```

### 13.2 토글 버튼

헤더 오른쪽에 Moon/Sun 아이콘 버튼으로 배치. 현재 테마가 `light`이면 Moon 아이콘, `dark`이면 Sun 아이콘 표시.

```typescript
import { Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

function ThemeToggle() {
  const { theme, setTheme } = useSettingsStore();
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
```
