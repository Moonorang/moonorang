'use client';

import { useRef } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';

// 이 거리(px)를 넘게 움직여야 '스크롤'로 본다 - 그 전까지는 제자리 클릭으로 취급해
// 칩 버튼을 눌렀을 때 정상적으로 클릭 이벤트가 나가야 한다
const DRAG_THRESHOLD_PX = 5;

/**
 * 가로 스크롤 영역을 마우스로 눌러 끌면 스크롤되게 한다.
 * 터치·트랙패드는 브라우저가 기본으로 처리해주지만, 마우스 드래그는 스크롤바를
 * 직접 잡지 않는 한 기본 지원되지 않아서 직접 구현한다.
 *
 * 반환한 값을 그대로 스크롤 컨테이너에 펼쳐 붙이면 된다:
 * `<div ref={ref} {...dragScrollProps}>`
 */
export function useDragScroll<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);
  const isPressedRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const handlePointerDown = (event: ReactPointerEvent<T>) => {
    // 터치·펜은 브라우저가 이미 스크롤을 처리하므로 마우스만 직접 잡는다
    if (event.pointerType !== 'mouse') return;

    const element = elementRef.current;
    if (!element) return;

    isPressedRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = event.clientX;
    startScrollLeftRef.current = element.scrollLeft;
    element.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<T>) => {
    if (!isPressedRef.current) return;

    const element = elementRef.current;
    if (!element) return;

    const delta = event.clientX - startXRef.current;
    if (!hasDraggedRef.current && Math.abs(delta) < DRAG_THRESHOLD_PX) return;

    // 문턱을 넘긴 뒤에는 텍스트가 끌려서 선택되지 않도록 막는다
    hasDraggedRef.current = true;
    element.style.userSelect = 'none';
    element.scrollLeft = startScrollLeftRef.current - delta;
  };

  const stopDragging = (event: ReactPointerEvent<T>) => {
    if (!isPressedRef.current) return;

    isPressedRef.current = false;
    const element = elementRef.current;
    if (element) {
      element.style.userSelect = '';
      element.releasePointerCapture(event.pointerId);
    }
  };

  // 실제로 끌었다면, 손을 뗄 때 자식(칩 버튼)에 클릭이 새로 나가지 않도록 막는다 -
  // 안 막으면 스크롤하려고 누른 게 의도치 않게 칩 클릭(질문 전송)으로 이어진다
  const handleClickCapture = (event: ReactMouseEvent<T>) => {
    if (!hasDraggedRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    hasDraggedRef.current = false;
  };

  return {
    ref: elementRef,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: stopDragging,
    onPointerCancel: stopDragging,
    onClickCapture: handleClickCapture,
  };
}
