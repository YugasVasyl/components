import {TestBed, inject, fakeAsync, tick} from '@angular/core/testing';
import {ScrollingModule} from './public-api';
import {ViewportRuler} from './viewport-ruler';
import {dispatchFakeEvent} from '../testing/private';
import {NgZone} from '@angular/core';
import {Subscription} from 'rxjs';

describe('ViewportRuler', () => {
  let viewportRuler: ViewportRuler;
  let ngZone: NgZone;

  let startingWindowWidth = window.innerWidth;
  let startingWindowHeight = window.innerHeight;

  // Create a very large element that will make the page scrollable.
  let veryLargeElement: HTMLElement = document.createElement('div');
  veryLargeElement.style.width = '6000px';
  veryLargeElement.style.height = '6000px';

  beforeEach(() => TestBed.configureTestingModule({
    imports: [ScrollingModule],
    providers: [ViewportRuler]
  }));

  beforeEach(inject([ViewportRuler, NgZone], (v: ViewportRuler, n: NgZone) => {
    viewportRuler = v;
    ngZone = n;
    scrollTo(0, 0);
  }));

  it('should get the viewport size', () => {
    let size = viewportRuler.getViewportSize();
    expect(size.width).toBe(window.innerWidth);
    expect(size.height).toBe(window.innerHeight);
  });

  it('should get the viewport bounds when the page is not scrolled', () => {
    let bounds = viewportRuler.getViewportRect();
    expect(bounds.top).toBe(0);
    expect(bounds.left).toBe(0);
    expect(bounds.bottom).toBe(window.innerHeight);
    expect(bounds.right).toBe(window.innerWidth);
  });

  it('should get the viewport bounds when the page is scrolled', () => {
    document.body.appendChild(veryLargeElement);

    scrollTo(1500, 2000);

    let bounds = viewportRuler.getViewportRect();

    // In the iOS simulator (BrowserStack & SauceLabs), adding the content to the
    // body causes karma's iframe for the test to stretch to fit that content once we attempt to
    // scroll the page. Setting width / height / maxWidth / maxHeight on the iframe does not
    // successfully constrain its size. As such, skip assertions in environments where the
    // window size has changed since the start of the test.
    if (window.innerWidth > startingWindowWidth || window.innerHeight > startingWindowHeight) {
      document.body.removeChild(veryLargeElement);
      return;
    }

    expect(bounds.top).toBe(2000);
    expect(bounds.left).toBe(1500);
    expect(bounds.bottom).toBe(2000 + window.innerHeight);
    expect(bounds.right).toBe(1500 + window.innerWidth);

    document.body.removeChild(veryLargeElement);
  });

  it('should get the bounds based on client coordinates when the page is pinch-zoomed', () => {
    // There is no API to make the browser pinch-zoom, so there's no real way to automate
    // tests for this behavior. Leaving this test here as documentation for the behavior.
  });

  it('should get the scroll position when the page is not scrolled', () => {
    let scrollPos = viewportRuler.getViewportScrollPosition();
    expect(scrollPos.top).toBe(0);
    expect(scrollPos.left).toBe(0);
  });

  it('should get the scroll position when the page is scrolled', () => {
    document.body.appendChild(veryLargeElement);

    scrollTo(1500, 2000);

    // In the iOS simulator (BrowserStack & SauceLabs), adding the content to the
    // body causes karma's iframe for the test to stretch to fit that content once we attempt to
    // scroll the page. Setting width / height / maxWidth / maxHeight on the iframe does not
    // successfully constrain its size. As such, skip assertions in environments where the
    // window size has changed since the start of the test.
    if (window.innerWidth > startingWindowWidth || window.innerHeight > startingWindowHeight) {
      document.body.removeChild(veryLargeElement);
      return;
    }

    let scrollPos = viewportRuler.getViewportScrollPosition();
    expect(scrollPos.top).toBe(2000);
    expect(scrollPos.left).toBe(1500);

    document.body.removeChild(veryLargeElement);
  });

  describe('changed event', () => {
    it('should dispatch an event when the window is resized', () => {
      const spy = jasmine.createSpy('viewport changed spy');
      const subscription = viewportRuler.change(0).subscribe(spy);

      dispatchFakeEvent(window, 'resize');
      expect(spy).toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should dispatch an event when the orientation is changed', () => {
      const spy = jasmine.createSpy('viewport changed spy');
      const subscription = viewportRuler.change(0).subscribe(spy);

      dispatchFakeEvent(window, 'orientationchange');
      expect(spy).toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should be able to throttle the callback', fakeAsync(() => {
      const spy = jasmine.createSpy('viewport changed spy');
      const subscription = viewportRuler.change(1337).subscribe(spy);

      dispatchFakeEvent(window, 'resize');
      expect(spy).not.toHaveBeenCalled();

      tick(1337);

      expect(spy).toHaveBeenCalledTimes(1);
      subscription.unsubscribe();
    }));

    it('should run the resize event outside the NgZone', () => {
      const spy = jasmine.createSpy('viewport changed spy');
      const subscription = viewportRuler.change(0).subscribe(() => spy(NgZone.isInAngularZone()));

      dispatchFakeEvent(window, 'resize');
      expect(spy).toHaveBeenCalledWith(false);
      subscription.unsubscribe();
    });

    it('should run events outside of the NgZone, even if the subcription is from inside', () => {
      const spy = jasmine.createSpy('viewport changed spy');
      let subscription: Subscription;

      ngZone.run(() => {
        subscription = viewportRuler.change(0).subscribe(() => spy(NgZone.isInAngularZone()));
        dispatchFakeEvent(window, 'resize');
      });

      expect(spy).toHaveBeenCalledWith(false);
      subscription!.unsubscribe();
    });

  });
});
