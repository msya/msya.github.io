(window.webpackJsonp=window.webpackJsonp||[]).push([[171],{FwSR:function(e,t,i){"use strict";i.r(t);i("KI7T"),i("XDJg");var n=i("RIqP"),r=i.n(n),o=i("PJYZ"),s=i.n(o),a=i("VbXa"),d=i.n(a),c=i("lSNA"),u=i.n(c),l=i("ERkP"),h=function(){function e(e,t,i,n){this.id=e,this._renderer=i,this.canBeAnchor=n,this.data=t}return e.prototype.render=function(){return(0,this._renderer)(this.data)},e}(),m=function(e,t,i,n){return new h(e,t,i,n)},f=(i("KYm4"),Object.freeze({FocusedItem:"focusedItem",Anchor:"anchor"})),p=function(e){return{anchor:e,type:f.Anchor}},_=function(e){return{itemId:e,type:f.FocusedItem}},g=i("A9rn"),v=i("Resy"),I=function(){function e(e){var t=e.viewportRect,i=e.listRect,n=e.listLength,r=e.renderedItems;this._viewportRect=t,this._listRect=i,this._listLength=n,this._renderedItems=r}var t=e.prototype;return t.getForList=function(){return this._listRect},t.getForViewport=function(){return this._viewportRect},t.getListLength=function(){return this._listLength},t.getRenderedItems=function(){return this._renderedItems},e}(),R=(i("DjDK"),i("PN9k"),i("8OQS")),T=i.n(R),w=(i("zQXS"),i("LnO1"),i("3eMz"),i("dtAy"),i("4oWw"),i("PRJl"),i("dPJJ")),A=i("pQ3Z"),b=i.n(A),H=i("+d3d"),y=i("38/B"),S=i("GVND"),P=i("06eB"),O=i.n(P),E=i("aITJ"),F=1e3,x="transform 0.15s linear",C=function(e){function t(t){var i;i=e.call(this,t)||this,u()(s()(i),"_shouldAnimateTranslate",!1),u()(s()(i),"_observeElement",(function(e){var t=i._resizeObserver;t&&(t.disconnect(),t.observe(e))})),u()(s()(i),"_handleResize",(function(e){var t=i.props,n=t.onHeightChanged,r=t.item,o=e[0],s=(o&&Math.floor(o.contentRect.height))!==(i._currentHeight&&Math.floor(i._currentHeight));o&&s&&(i._currentHeight=o.contentRect.height,n(r.id,o.contentRect.height))})),u()(s()(i),"_setRef",(function(e){var t=i.props,n=t.item,r=t.setAPI;e?(i._element=e,r(n.id,s()(i)),i._observeElement(e)):(r(n.id,void 0),i._element=void 0)})),u()(s()(i),"_handleAnimationStarted",(function(e){void 0===e&&(e=x),i._resizeObserver&&i._resizeObserver.disconnect(),i.props.onAnimationStarted(i.props.item.id,e),i._animationTTLTimeoutId&&clearTimeout(i._animationTTLTimeoutId),i._animationTTLTimeoutId=setTimeout(i._handleAnimationEnded,F)})),u()(s()(i),"_handleAnimationEnded",(function(){i._animationTTLTimeoutId&&(clearTimeout(i._animationTTLTimeoutId),i._animationTTLTimeoutId=null),i._element&&i._observeElement(i._element),i.props.onAnimationEnded(i.props.item.id)})),u()(s()(i),"_handleHeightChanged",(function(e){i._currentHeight=e,i.props.onHeightChanged(i.props.item.id,e)}));var n=E.a.isSafari()?window.PolyfillResizeObserver:window.ResizeObserver;return i._resizeObserver=new n(i._handleResize),i._animationContext={onAnimationEnded:i._handleAnimationEnded,onAnimationStarted:i._handleAnimationStarted,onHeightChanged:i._handleHeightChanged},i}d()(t,e);var i=t.prototype;return i.shouldComponentUpdate=function(e){var t=this.props,i=t.item,n=t.offset,r=t.visible,o=t.shouldAnimate;return this._shouldAnimateTranslate=e.offset!==n&&e.visible===r,!O()(e.item,i)||e.offset!==n||e.visible!==r||e.shouldAnimate!==o},i.componentWillUnmount=function(){this._animationTTLTimeoutId&&(clearTimeout(this._animationTTLTimeoutId),this.props.onAnimationEnded(this.props.item.id)),this._resizeObserver&&this._resizeObserver.disconnect(),this._resizeObserver=void 0},i.componentDidUpdate=function(e){var t=this.props,i=t.item,n=t.setAPI;e.item.id!==i.id&&(n(e.item.id,void 0),n(i.id,this))},i.measureHeight=function(){return this._currentHeight||(this._currentHeight=this._element?this._element.getBoundingClientRect().height:0),this._currentHeight},i.render=function(){var e=this.props,t=e.item,i=e.offset,n=e.visible,r=e.shouldAnimate,o=e.translationTransitionStyle,s=this._shouldAnimateTranslate&&!y.a.reducedMotionEnabled?o:"opacity 0.3s ease-out";return l.createElement(S.a.Provider,{value:this._animationContext},l.createElement("div",{ref:this._setRef,style:{position:"absolute",opacity:n?void 0:.01,width:"100%",transform:"translateY("+i+"px)",transition:r?s:void 0}},t.render()))},t}(l.Component);u()(C,"defaultProps",{translationTransitionStyle:x});var L=i("Qyxo"),U=i("VY6S"),j=i("mN6z"),z=i("qdp+"),V=i("/NU0"),M=function(e){return Array.isArray(e)?e[0]:void 0},B=i("jat/"),D=i("tn7R"),N=i("Myq3"),W=i("I7xG"),k=i("jHwr"),K={},q=100,J=250,Q=function(e){function t(t){var i;i=e.call(this,t)||this,u()(s()(i),"_cells",new Map),u()(s()(i),"_isFullScreened",!1),u()(s()(i),"_renderedItemsStatus",new Set),u()(s()(i),"_rootRef",l.createRef()),u()(s()(i),"_slice",{start:0,end:0}),u()(s()(i),"_cellAnimationStyle",x),u()(s()(i),"_cellAnimations",new Set),u()(s()(i),"_handleScroll",(function(){i._isInitialAnchoring||(i._scheduleCriticalUpdateThrottled(),i._scheduleNormalizationUpdateDebounced())})),u()(s()(i),"_handleEnterFullscreen",(function(){i._isFullScreened=!0})),u()(s()(i),"_handleExitFullscreen",(function(){i._isFullScreened=!1,i._scheduleNormalizationUpdate()})),u()(s()(i),"_getFinalRenderedItems",Object(W.a)(s()(i),(function(e,t,i){return i._getItemMap()}),(function(e,t){return t.renderedItems}),(function(e,t){return Object(L.a)(t,(function(t){var i=t.itemId,n=T()(t,["itemId"]),r=e.get(i);return r&&Object.assign({},n,{item:r})}))}))),u()(s()(i),"_getItemMap",Object(W.a)(s()(i),(function(e){return e.list}),(function(e){var t=new Map;return e.forEach((function(e){t.set(e.id,e)})),t}))),u()(s()(i),"_getItemPositionsMap",(function(e){var t=i.props.list,n=i._getDistanceFromTop(e.itemId),r=e.offset-n,o={};return t.forEach((function(e){var t=i._getHeight(e);o[e.id]={item:e,rectangle:new v.a(r,t)},r+=t})),o})),u()(s()(i),"_handleAnimationStarted",(function(e,t){i._cellAnimations.add(e),t&&(i._cellAnimationStyle=t)})),u()(s()(i),"_handleAnimationEnded",(function(e){i._cellAnimations.delete(e),i._cellAnimationStyle=x})),u()(s()(i),"_handleHeightChanged",(function(e,t,n){void 0===n&&(n=!1),i._heights.get(e)!==t&&(i._cellAnimations.has(e)?i._scheduleCriticalUpdate():i._scheduleCriticalUpdateDebouncedAndThrottled())})),u()(s()(i),"_setItemRef",(function(e,t){t?(i._cells.set(e,t),i._renderedItemsStatus.add(e)):(i._cells.delete(e),i._renderedItemsStatus.delete(e))})),i._viewport=t.viewport,i._devicePixelRatio=window.devicePixelRatio||1,i.state={renderedItems:[],listHeight:0,shouldAnimate:!1};var n=i.props.cacheKey;n&&K.hasOwnProperty(n)?i._heights=K[n]:i._heights=new Map,i._scheduleCriticalUpdate=Object(k.a)((function(){return i._update()}),window.requestAnimationFrame);var r=Object(k.a)((function(){i._update({isIdle:!0})}),window.requestAnimationFrame);return i._scheduleNormalizationUpdate=window.requestIdleCallback?Object(k.a)((function(){i._update({isIdle:!0})}),window.requestIdleCallback):r,i._scheduleCriticalUpdateThrottled=Object(H.a)((function(){i._scheduleCriticalUpdate()}),q,{trailing:!0}),i._scheduleCriticalUpdateDebouncedAndThrottled=Object(U.a)((function(){i._scheduleCriticalUpdateThrottled()}),J),i._scheduleNormalizationUpdateDebounced=Object(U.a)((function(){i._scheduleNormalizationUpdate()}),J),window.scroller=s()(i),i}d()(t,e);var i=t.prototype;return i.render=function(){var e=this,t=this.state,i=t.listHeight,n=t.shouldAnimate;return l.createElement("div",{ref:this._rootRef,style:{position:"relative",minHeight:i}},this._getFinalRenderedItems().map((function(t){var i,r,o,s=t.item,a=t.offset,d=t.visible;return l.createElement(C,{item:s,key:s.id,offset:(i={cssPixels:a,dpr:e._devicePixelRatio},r=i.cssPixels,o=i.dpr,Math.round(r*o)/o),onAnimationEnded:e._handleAnimationEnded,onAnimationStarted:e._handleAnimationStarted,onHeightChanged:e._handleHeightChanged,setAPI:e._setItemRef,shouldAnimate:n,translationTransitionStyle:e._cellAnimationStyle,visible:d})})))},i.shouldComponentUpdate=function(e,t){return!b()(this.props,e)||!Object(j.a)(this.state,t)},i.componentDidUpdate=function(e){e.list!==this.props.list&&this._scheduleNormalizationUpdate()},i.componentDidMount=function(){var e=this;this._removeScrollHandler=this._viewport.addScrollListener(this._handleScroll),this._removeFullscreenEnterHandler=w.a(this._handleEnterFullscreen),this._removeFullscreenExitHandler=w.b(this._handleExitFullscreen);var t=this._getInitialRenderedItems();if(this.props.isManualScrollRestoration&&this._viewport.scrollBy(-1),t.length>0){var i=this._getDocumentViewportHeight();this.setState({renderedItems:t,shouldAnimate:!0,listHeight:i},(function(){var t;if(e._isInitialAnchoring=!0,(null===(t=e.props.initialAnchor)||void 0===t?void 0:t.type)===f.Anchor){var i=e._rootRef.current&&e._rootRef.current.getBoundingClientRect();i&&e._viewport.scrollBy(i.top)}window.requestAnimationFrame((function(){return window.requestAnimationFrame((function(){return e._scheduleCriticalUpdate()}))}))}))}else this._scheduleCriticalUpdate()},i.componentWillUnmount=function(){this._removeScrollHandler&&this._removeScrollHandler(),this._removeFullscreenEnterHandler&&this._removeFullscreenEnterHandler(),this._removeFullscreenExitHandler&&this._removeFullscreenExitHandler();var e=this.props.cacheKey;e&&(K[e]=this._heights)},i._getDocumentViewportHeight=function(){var e;return(null===(e=document.documentElement)||void 0===e?void 0:e.clientHeight)||0},i._getInitialRenderedItems=function(){var e=this.props,t=e.initialAnchor,i=e.list,n=[];if(!t)return n;if(t.type===f.FocusedItem){var r=Object(z.a)(i,(function(e){return e.id===t.itemId?{itemId:e.id,offset:0,visible:!0}:void 0}));r&&n.push(r)}else if(t.type===f.Anchor&&Object(V.a)(t.anchor.distanceToViewportTop))for(var o=t.anchor,s=this._getDocumentViewportHeight(),a=o.distanceToViewportTop||0,d=i.findIndex((function(e){return e.id===o.id}));d>-1&&d<i.length&&a<s;){var c=i[d],u=this._heights.get(c.id);if(!Object(V.a)(u))break;n.push({itemId:c.id,offset:a,visible:!0}),a+=u,d++}return n},i.getAnchors=function(){var e=this._rootRef.current&&this._rootRef.current.getBoundingClientRect(),t=this._measureRelativeViewportRect();return e&&t?this._getItemsWithin(t).filter((function(e){return e.item.canBeAnchor})).map((function(t){return{id:t.item.id,distanceToViewportTop:e.top+t.offset}})):[]},i._update=function(e){var t=(void 0===e?{}:e).isIdle,i=this._measureRelativeViewportRect();if(i&&!this._isFullScreened){var n=this._getAnchor(i);this._measureHeights(),n&&this._updateRenderedItems(n,i,!!t)}},i._getSliceForCandidates=function(e,t,i){var n=M(e),r=Object(B.a)(e);return{start:n?t.indexOf(i[n.itemId]):0,end:r?t.indexOf(i[r.itemId])+1:0}},i._getRenderCandidates=function(e,t,i){var n=this;void 0===i&&(i=!1);var r=this.props,o=r.minimumOffscreenToViewportRatio,s=r.preferredOffscreenToViewportRatio,a=G(t,o),d=G(t,s),c=this._getItemPositionsMap(e),u=Object(D.a)(c),l=u.filter((function(e){e.item;return e.rectangle.doesIntersectWith(i?d:a)})).map((function(e){var t=e.item,i=e.rectangle;return{itemId:t.id,offset:i.getTop(),visible:n._heights.has(t.id)}})),h=this._getSliceForCandidates(l,u,c),m=i?h:function(e,t){if(t.start>=e.start&&t.end<=e.end)return e;if(t.start>=e.end||t.end<=e.start)return t;var i=Math.max(e.start-t.start,t.end-e.end);return{start:Math.min(e.start+i,t.start),end:Math.max(e.end-i,t.end)}}(this._slice,h),f=u.slice(m.start,m.end).map((function(e){var t=e.item,i=e.rectangle;return{itemId:t.id,offset:i.getTop(),visible:n._heights.has(t.id)}}));return{itemPositions:u,newRenderedItems:f,slice:m,arePreferredItemsRendered:i}},i._updateRenderedItems=function(e,t,i){var n=this;void 0===i&&(i=!1);var r=this.props,o=r.list,s=r.onPositionUpdate,a=this._getRenderCandidates(e,t,i),d=a.newRenderedItems,c=a.itemPositions,u=a.arePreferredItemsRendered,l=a.slice,h=0!==this._cellAnimations.size,m=0!==this._getListOffset(e),f=M(c),p=Object(B.a)(c),_=f&&p?p.rectangle.getBottom()-f.rectangle.getTop():0,g=_+this._calculateHeadroom(c,t),R=!d.find((function(e){var t=e.itemId;return!n._heights.has(t)})),T=!h&&R&&(i||g<=t.getHeight())||R&&this._isInitialAnchoring,w=d;if(this._slice=l,R&&(this._isInitialAnchoring=!1),m&&T){var A=this._normalization(e,d),b=A.offset,H=A.renderedItems;w=H,this.setState({renderedItems:H,listHeight:g,shouldAnimate:!m},(function(){0!==b&&n._viewport.scrollBy(-b)}))}else this.setState({renderedItems:d,listHeight:g,shouldAnimate:!0},(function(){!m&&u||n._scheduleNormalizationUpdateDebounced()}));s(new I({viewportRect:t,listRect:new v.a(f?f.rectangle.getTop():0,_),listLength:o.length,renderedItems:w.map((function(e){return{id:e.itemId,rectangle:new v.a(e.offset,n._getHeightForItemId(e.itemId))}}))}))},i._normalization=function(e,t){var i=this._getListOffset(e);return 0!==i?{offset:i,renderedItems:t.map((function(e){var t=e.offset,n=T()(e,["offset"]);return Object.assign({},n,{offset:t-i})}))}:{offset:0,renderedItems:t}},i._calculateHeadroom=function(e,t){var i=Object(N.a)(e,(function(e){return e.item.canBeAnchor})),n=Object(B.a)(e);if(!n)return 0;var r=n.rectangle.getBottom()-(i?i.rectangle.getTop():n.rectangle.getTop());return Math.max(0,t.getHeight()-r)},i._getListOffset=function(e){if(!e)return 0;var t=this._getDistanceFromTop(e.itemId);return e.offset-t},i._getAnchor=function(e){var t=this;if(!this._isInitialAnchoring&&this.props.pinToTopWhenAtTop&&e.getTop()<=0){var i=M(this.props.list);return i?{itemId:i.id,offset:0}:void 0}var n=function(t){var i,n,r=(i=t,n=e,Math.max(0,Math.min(i.getBottom(),n.getBottom())-Math.max(i.getTop(),n.getTop())));return t.getHeight()>0?r/t.getHeight():0},r=function(t){return Math.abs(e.getTop()-t.getTop())},o=this._getFinalRenderedItems(),s=Y(o,(function(e,i){if(!e.item.canBeAnchor)return-1;if(!i.item.canBeAnchor)return 1;var o=new v.a(e.offset,t._getHeight(e.item)),s=new v.a(i.offset,t._getHeight(i.item));return n(o)-n(s)||r(s)-r(o)}));if(s)return{itemId:s.item.id,offset:s.offset};var a=M(o);if(a)return{itemId:a.item.id,offset:a.offset};var d=M(this.props.list);return d?{itemId:d.id,offset:0}:void 0},i._measureRelativeViewportRect=function(){var e=this._rootRef.current;if(e)return this._viewport.getRect().translateBy(-e.getBoundingClientRect().top)},i._getHeight=function(e){return this._getHeightForItemId(e.id)},i._getHeightForItemId=function(e){var t=this.props.assumedItemHeight,i=this._heights.get(e);return Object(V.a)(i)?i:t},i._getDistanceFromTop=function(e){var t=this,i=this.props.list,n=i.findIndex((function(t){return t.id===e}));return n>=0?i.slice(0,n).reduce((function(e,i){return t._getHeight(i)+e}),0):0},i._getItemsWithin=function(e){var t=this;return this._getFinalRenderedItems().filter((function(i){var n=i.item,r=i.offset;return new v.a(r,t._getHeight(n)).doesIntersectWith(e)}))},i._measureHeights=function(){var e=this;this._cells.forEach((function(t,i){e._heights.set(i,t.measureHeight())}))},i.findTopmostVisibleId=function(){var e=this,t=this._measureRelativeViewportRect(),i=t&&this._getFinalRenderedItems().find((function(i){var n=i.item,r=i.offset;return new v.a(r,e._getHeight(n)).doesIntersectWith(t)}));return i&&i.item.id},i.scrollToTop=function(){this._viewport.scrollToTop()},t}(l.Component);u()(Q,"defaultProps",{nearEndProximityRatio:1.75,nearStartProximityRatio:.25,assumedItemHeight:400,minimumOffscreenToViewportRatio:.5,preferredOffscreenToViewportRatio:2.5});var Y=function(e,t){if(e.length)return e.reduce((function(e,i){return t(i,e)>0?i:e}))},G=function(e,t){var i=t*e.getHeight();return new v.a(e.getTop()-i,e.getHeight()+2*i)},X=i("nfVA"),Z=i("Lqdf"),$=i("aWzz"),ee=i("oQhu"),te=i("fs1G");i.d(t,"default",(function(){return ie}));var ie=function(e){function t(t,i){var n;n=e.call(this,t,i)||this,u()(s()(n),"_renderer",l.createRef()),u()(s()(n),"_getList",Object(ee.a)((function(e,t,i,n,o){var s=[];return e&&s.push(m("$header","header",(function(){return e}),!1)),s.push.apply(s,r()(i.map((function(e){return m(o(e),e,n,!0)})))),t&&s.push(m("$footer","footer",(function(){return t}),!1)),s}))),u()(s()(n),"_handlePositionUpdate",(function(e){var t=n.props.onItemsRendered;n._edgeProximity.handlePositioningUpdate(e),t&&t({positions:e.getRenderedItems(),viewport:e.getForViewport()})}));var o=t.nearStartProximityRatio,a=t.nearEndProximityRatio;return n._edgeProximity=new Z.b([{condition:Z.a.nearTop(5),callback:function(e){return n.props.onAtStart(e)}},{condition:Z.a.nearTopRatio(o),callback:function(e){return n.props.onNearStart(e)}},{condition:Z.a.nearBottomRatio(a),callback:function(e){return n.props.onNearEnd(e)}},{condition:Z.a.nearBottom(5),callback:function(e){return n.props.onAtEnd(e)}}]),n._viewport=t.viewport||n.context&&n.context.viewport||X.a.root(),n._loadStoredPosition(t,n.context),n}d()(t,e);var i=t.prototype;return i.render=function(){var e=this.props,t=e.anchoring,i=e.assumedItemHeight,n=e.cacheKey,r=e.footer,o=e.header,s=e.identityFunction,a=e.initialAnchor,d=e.items,c=e.noItemsRenderer,u=e.renderer,h=this._scrollRestorationAnchor[n],m=h?p(h):a?_(a.id):void 0;return d.length?l.createElement(Q,{assumedItemHeight:i,cacheKey:n,initialAnchor:m,isManualScrollRestoration:window.history&&"manual"===window.history.scrollRestoration,key:n,list:this._getList(o,r,d,u,s),onPositionUpdate:this._handlePositionUpdate,pinToTopWhenAtTop:t.pinToTopWhenAtTop,ref:this._renderer,viewport:this._viewport}):c()},i.componentDidMount=function(){(0,this.props.onPositionRestored)()},i.componentDidUpdate=function(e){var t=this.props,i=t.cacheKey,n=t.onPositionRestored;i!==e.cacheKey&&n()},i.UNSAFE_componentWillReceiveProps=function(e){this.props.cacheKey!==e.cacheKey&&(this._preservePosition(this._customLocation),this._loadStoredPosition(e,this.context))},i.componentWillUnmount=function(){this._preservePosition(this._customLocation)},i._preservePosition=function(e){if(e&&this._renderer.current){var t=this._renderer.current.getAnchors();e.savePosition(t)}},i._loadStoredPosition=function(e,t){var i,n=t.getCustomLocation;this._customLocation=n&&n();var r=[];if(this._customLocation){var o=this._customLocation.getSavedPosition();(r=o&&o.length?o:[]).length>0&&this._customLocation&&this._customLocation.claimScrollRestoration()}var s=r.find((function(t){var i=t.id;t.distanceToViewportTop;return!!e.items.find((function(t){return e.identityFunction(t)===i}))}));this._scrollRestorationAnchor=((i={})[e.cacheKey]=s,i)},i.findTopmostVisibleId=function(){return this._renderer.current?this._renderer.current.findTopmostVisibleId():void 0},i.scrollToTop=function(){this._renderer.current&&this._renderer.current.scrollToTop()},t}(l.PureComponent);u()(ie,"contextTypes",{viewport:$.object,getCustomLocation:$.func}),u()(ie,"defaultProps",{anchoring:g.a,onPositionRestored:te.a,onAtEnd:te.a,onAtStart:te.a,onNearEnd:te.a,onNearStart:te.a,nearEndProximityRatio:1.75,nearStartProximityRatio:.25,noItemsRenderer:function(){return null},assumedItemHeight:400,minimumOffscreenToViewportRatio:.5,preferredOffscreenToViewportRatio:2.5})}}]);
//# sourceMappingURL=https://ton.smf1.twitter.com/responsive-web-internal/sourcemaps/web/loader.AbsolutePower.da1474b4.js.map