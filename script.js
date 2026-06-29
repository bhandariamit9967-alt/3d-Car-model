 (function () {
            'use strict';
            const _changeEvent = { type: 'change' }, _startEvent = { type: 'start' }, _endEvent = { type: 'end' };
            THREE.OrbitControls = function (object, domElement) {
                if (domElement === undefined) console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.');
                if (domElement === document) console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.');
                this.object = object; this.domElement = domElement; this.enabled = true;
                this.target = new THREE.Vector3();
                this.minDistance = 0; this.maxDistance = Infinity;
                this.minZoom = 0; this.maxZoom = Infinity;
                this.minPolarAngle = 0; this.maxPolarAngle = Math.PI;
                this.minAzimuthAngle = -Infinity; this.maxAzimuthAngle = Infinity;
                this.enableDamping = false; this.dampingFactor = 0.05;
                this.enableZoom = true; this.zoomSpeed = 1.0;
                this.enableRotate = true; this.rotateSpeed = 1.0;
                this.enablePan = true; this.panSpeed = 1.0; this.screenSpacePanning = true; this.keyPanSpeed = 7.0;
                this.autoRotate = false; this.autoRotateSpeed = 2.0;
                this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
                this.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
                this.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
                this.target0 = this.target.clone(); this.position0 = this.object.position.clone(); this.zoom0 = this.object.zoom;
                this._domElementKeyEvents = null;
                this.getPolarAngle = function () { return spherical.phi; };
                this.getAzimuthalAngle = function () { return spherical.theta; };
                this.getDistance = function () { return this.object.position.distanceTo(this.target); };
                this.listenToKeyEvents = function (domElement) { domElement.addEventListener('keydown', onKeyDown); this._domElementKeyEvents = domElement; };
                this.saveState = function () { scope.target0.copy(scope.target); scope.position0.copy(scope.object.position); scope.zoom0 = scope.object.zoom; };
                this.reset = function () { scope.target.copy(scope.target0); scope.object.position.copy(scope.position0); scope.object.zoom = scope.zoom0; scope.object.updateProjectionMatrix(); scope.dispatchEvent(_changeEvent); scope.update(); state = STATE.NONE; };
                this.update = function () {
                    var offset = new THREE.Vector3();
                    var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
                    var quatInverse = quat.clone().invert();
                    var lastPosition = new THREE.Vector3(); var lastQuaternion = new THREE.Quaternion();
                    var twoPI = 2 * Math.PI;
                    return function update() {
                        var position = scope.object.position;
                        offset.copy(position).sub(scope.target);
                        offset.applyQuaternion(quat);
                        spherical.setFromVector3(offset);
                        if (scope.autoRotate && state === STATE.NONE) { rotateLeft(getAutoRotationAngle()); }
                        if (scope.enableDamping) { spherical.theta += sphericalDelta.theta * scope.dampingFactor; spherical.phi += sphericalDelta.phi * scope.dampingFactor; }
                        else { spherical.theta += sphericalDelta.theta; spherical.phi += sphericalDelta.phi; }
                        var min = scope.minAzimuthAngle; var max = scope.maxAzimuthAngle;
                        if (isFinite(min) && isFinite(max)) { if (min < -Math.PI) min += twoPI; else if (min > Math.PI) min -= twoPI; if (max < -Math.PI) max += twoPI; else if (max > Math.PI) max -= twoPI; if (min <= max) { spherical.theta = Math.max(min, Math.min(max, spherical.theta)); } else { spherical.theta = (spherical.theta > ((min + max) / 2)) ? Math.max(min, spherical.theta) : Math.min(max, spherical.theta); } }
                        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
                        spherical.makeSafe();
                        spherical.radius *= scale;
                        spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
                        scope.target.addScaledVector(panOffset, scope.enableDamping ? scope.dampingFactor : 1);
                        offset.setFromSpherical(spherical);
                        offset.applyQuaternion(quatInverse);
                        position.copy(scope.target).add(offset);
                        scope.object.lookAt(scope.target);
                        if (scope.enableDamping === true) { sphericalDelta.theta *= (1 - scope.dampingFactor); sphericalDelta.phi *= (1 - scope.dampingFactor); panOffset.multiplyScalar(1 - scope.dampingFactor); }
                        else { sphericalDelta.set(0, 0, 0); panOffset.set(0, 0, 0); }
                        scale = 1;
                        if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) { scope.dispatchEvent(_changeEvent); lastPosition.copy(scope.object.position); lastQuaternion.copy(scope.object.quaternion); zoomChanged = false; return true; }
                        return false;
                    };
                }();
                this.dispose = function () { scope.domElement.removeEventListener('contextmenu', onContextMenu); scope.domElement.removeEventListener('pointerdown', onPointerDown); scope.domElement.removeEventListener('wheel', onMouseWheel); scope.domElement.removeEventListener('pointermove', onPointerMove); scope.domElement.removeEventListener('pointerup', onPointerUp); if (scope._domElementKeyEvents !== null) { scope._domElementKeyEvents.removeEventListener('keydown', onKeyDown); } };
                var scope = this; var STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_PAN: 4, TOUCH_DOLLY_PAN: 5, TOUCH_DOLLY_ROTATE: 6 };
                var state = STATE.NONE; var EPS = 0.000001; var spherical = new THREE.Spherical(); var sphericalDelta = new THREE.Spherical();
                var scale = 1; var panOffset = new THREE.Vector3(); var zoomChanged = false;
                var rotateStart = new THREE.Vector2(); var rotateEnd = new THREE.Vector2(); var rotateDelta = new THREE.Vector2();
                var panStart = new THREE.Vector2(); var panEnd = new THREE.Vector2(); var panDelta = new THREE.Vector2();
                var dollyStart = new THREE.Vector2(); var dollyEnd = new THREE.Vector2(); var dollyDelta = new THREE.Vector2();
                var pointers = []; var pointerPositions = {};
                function getAutoRotationAngle() { return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed; }
                function getZoomScale() { return Math.pow(0.95, scope.zoomSpeed); }
                function rotateLeft(angle) { sphericalDelta.theta -= angle; }
                function rotateUp(angle) { sphericalDelta.phi -= angle; }
                var panLeft = function () { var v = new THREE.Vector3(); return function panLeft(distance, objectMatrix) { v.setFromMatrixColumn(objectMatrix, 0); v.multiplyScalar(-distance); panOffset.add(v); }; }();
                var panUp = function () { var v = new THREE.Vector3(); return function panUp(distance, objectMatrix) { if (scope.screenSpacePanning === true) { v.setFromMatrixColumn(objectMatrix, 1); } else { v.setFromMatrixColumn(objectMatrix, 0); v.crossVectors(scope.object.up, v); } v.multiplyScalar(distance); panOffset.add(v); }; }();
                var pan = function () { var offset = new THREE.Vector3(); return function pan(deltaX, deltaY) { var element = scope.domElement; if (scope.object.isPerspectiveCamera) { var position = scope.object.position; offset.copy(position).sub(scope.target); var targetDistance = offset.length(); targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180); panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix); panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix); } else if (scope.object.isOrthographicCamera) { panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix); panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix); } else { console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.'); scope.enablePan = false; } }; }();
                function dollyOut(dollyScale) { if (scope.object.isPerspectiveCamera) { scale /= dollyScale; } else if (scope.object.isOrthographicCamera) { scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale)); scope.object.updateProjectionMatrix(); zoomChanged = true; } else { console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'); scope.enableZoom = false; } }
                function dollyIn(dollyScale) { if (scope.object.isPerspectiveCamera) { scale *= dollyScale; } else if (scope.object.isOrthographicCamera) { scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale)); scope.object.updateProjectionMatrix(); zoomChanged = true; } else { console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'); scope.enableZoom = false; } }
                function handleMouseDownRotate(event) { rotateStart.set(event.clientX, event.clientY); }
                function handleMouseDownDolly(event) { dollyStart.set(event.clientX, event.clientY); }
                function handleMouseDownPan(event) { panStart.set(event.clientX, event.clientY); }
                function handleMouseMoveRotate(event) { rotateEnd.set(event.clientX, event.clientY); rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed); var element = scope.domElement; rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight); rotateStart.copy(rotateEnd); scope.update(); }
                function handleMouseMoveDolly(event) { dollyEnd.set(event.clientX, event.clientY); dollyDelta.subVectors(dollyEnd, dollyStart); if (dollyDelta.y > 0) { dollyOut(getZoomScale()); } else if (dollyDelta.y < 0) { dollyIn(getZoomScale()); } dollyStart.copy(dollyEnd); scope.update(); }
                function handleMouseMovePan(event) { panEnd.set(event.clientX, event.clientY); panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed); pan(panDelta.x, panDelta.y); panStart.copy(panEnd); scope.update(); }
                function handleMouseWheel(event) { if (event.deltaY < 0) { dollyIn(getZoomScale()); } else if (event.deltaY > 0) { dollyOut(getZoomScale()); } scope.update(); }
                function handleKeyDown(event) { var needsUpdate = false; switch (event.code) { case scope.keys.UP: pan(0, scope.keyPanSpeed); needsUpdate = true; break; case scope.keys.BOTTOM: pan(0, -scope.keyPanSpeed); needsUpdate = true; break; case scope.keys.LEFT: pan(scope.keyPanSpeed, 0); needsUpdate = true; break; case scope.keys.RIGHT: pan(-scope.keyPanSpeed, 0); needsUpdate = true; break; }if (needsUpdate) { event.preventDefault(); scope.update(); } }
                function handleTouchStartRotate() { if (pointers.length === 1) { rotateStart.set(pointers[0].pageX, pointers[0].pageY); } else { var x = 0.5 * (pointers[0].pageX + pointers[1].pageX); var y = 0.5 * (pointers[0].pageY + pointers[1].pageY); rotateStart.set(x, y); } }
                function handleTouchStartPan() { if (pointers.length === 1) { panStart.set(pointers[0].pageX, pointers[0].pageY); } else { var x = 0.5 * (pointers[0].pageX + pointers[1].pageX); var y = 0.5 * (pointers[0].pageY + pointers[1].pageY); panStart.set(x, y); } }
                function handleTouchStartDolly() { var dx = pointers[0].pageX - pointers[1].pageX; var dy = pointers[0].pageY - pointers[1].pageY; var distance = Math.sqrt(dx * dx + dy * dy); dollyStart.set(0, distance); }
                function handleTouchStartDollyPan() { if (scope.enableZoom) handleTouchStartDolly(); if (scope.enablePan) handleTouchStartPan(); }
                function handleTouchStartDollyRotate() { if (scope.enableZoom) handleTouchStartDolly(); if (scope.enableRotate) handleTouchStartRotate(); }
                function handleTouchMoveRotate(event) { if (pointers.length == 1) { rotateEnd.set(event.pageX, event.pageY); } else { var position = getSecondPointerPosition(event); var x = 0.5 * (event.pageX + position.x); var y = 0.5 * (event.pageY + position.y); rotateEnd.set(x, y); } rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed); var element = scope.domElement; rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight); rotateStart.copy(rotateEnd); }
                function handleTouchMovePan(event) { if (pointers.length === 1) { panEnd.set(event.pageX, event.pageY); } else { var position = getSecondPointerPosition(event); var x = 0.5 * (event.pageX + position.x); var y = 0.5 * (event.pageY + position.y); panEnd.set(x, y); } panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed); pan(panDelta.x, panDelta.y); panStart.copy(panEnd); }
                function handleTouchMoveDolly(event) { var position = getSecondPointerPosition(event); var dx = event.pageX - position.x; var dy = event.pageY - position.y; var distance = Math.sqrt(dx * dx + dy * dy); dollyEnd.set(0, distance); dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed)); dollyOut(dollyDelta.y); dollyStart.copy(dollyEnd); }
                function handleTouchMoveDollyPan(event) { if (scope.enableZoom) handleTouchMoveDolly(event); if (scope.enablePan) handleTouchMovePan(event); }
                function handleTouchMoveDollyRotate(event) { if (scope.enableZoom) handleTouchMoveDolly(event); if (scope.enableRotate) handleTouchMoveRotate(event); }
                function onPointerDown(event) { if (scope.enabled === false) return; if (pointers.length === 0) { scope.domElement.setPointerCapture(event.pointerId); scope.domElement.addEventListener('pointermove', onPointerMove); scope.domElement.addEventListener('pointerup', onPointerUp); } addPointer(event); if (event.pointerType === 'touch') { onTouchStart(event); } else { onMouseDown(event); } }
                function onPointerMove(event) { if (scope.enabled === false) return; if (event.pointerType === 'touch') { onTouchMove(event); } else { onMouseMove(event); } }
                function onPointerUp(event) { removePointer(event); if (pointers.length === 0) { scope.domElement.releasePointerCapture(event.pointerId); scope.domElement.removeEventListener('pointermove', onPointerMove); scope.domElement.removeEventListener('pointerup', onPointerUp); } scope.dispatchEvent(_endEvent); state = STATE.NONE; }
                function onMouseDown(event) { var mouseAction; switch (event.button) { case 0: mouseAction = scope.mouseButtons.LEFT; break; case 1: mouseAction = scope.mouseButtons.MIDDLE; break; case 2: mouseAction = scope.mouseButtons.RIGHT; break; default: mouseAction = -1; }switch (mouseAction) { case THREE.MOUSE.DOLLY: if (scope.enableZoom === false) return; handleMouseDownDolly(event); state = STATE.DOLLY; break; case THREE.MOUSE.ROTATE: if (event.ctrlKey || event.metaKey || event.shiftKey) { if (scope.enablePan === false) return; handleMouseDownPan(event); state = STATE.PAN; } else { if (scope.enableRotate === false) return; handleMouseDownRotate(event); state = STATE.ROTATE; } break; case THREE.MOUSE.PAN: if (event.ctrlKey || event.metaKey || event.shiftKey) { if (scope.enableRotate === false) return; handleMouseDownRotate(event); state = STATE.ROTATE; } else { if (scope.enablePan === false) return; handleMouseDownPan(event); state = STATE.PAN; } break; default: state = STATE.NONE; }if (state !== STATE.NONE) { scope.dispatchEvent(_startEvent); } }
                function onMouseMove(event) { if (scope.enabled === false) return; switch (state) { case STATE.ROTATE: if (scope.enableRotate === false) return; handleMouseMoveRotate(event); break; case STATE.DOLLY: if (scope.enableZoom === false) return; handleMouseMoveDolly(event); break; case STATE.PAN: if (scope.enablePan === false) return; handleMouseMovePan(event); break; } }
                function onMouseWheel(event) { if (scope.enabled === false || scope.enableZoom === false || (state !== STATE.NONE && state !== STATE.ROTATE)) return; event.preventDefault(); scope.dispatchEvent(_startEvent); handleMouseWheel(event); scope.dispatchEvent(_endEvent); }
                function onKeyDown(event) { if (scope.enabled === false || scope.enablePan === false) return; handleKeyDown(event); }
                function onTouchStart(event) { trackPointer(event); switch (pointers.length) { case 1: switch (scope.touches.ONE) { case THREE.TOUCH.ROTATE: if (scope.enableRotate === false) return; handleTouchStartRotate(); state = STATE.TOUCH_ROTATE; break; case THREE.TOUCH.PAN: if (scope.enablePan === false) return; handleTouchStartPan(); state = STATE.TOUCH_PAN; break; default: state = STATE.NONE; }break; case 2: switch (scope.touches.TWO) { case THREE.TOUCH.DOLLY_PAN: if (scope.enableZoom === false && scope.enablePan === false) return; handleTouchStartDollyPan(); state = STATE.TOUCH_DOLLY_PAN; break; case THREE.TOUCH.DOLLY_ROTATE: if (scope.enableZoom === false && scope.enableRotate === false) return; handleTouchStartDollyRotate(); state = STATE.TOUCH_DOLLY_ROTATE; break; default: state = STATE.NONE; }break; default: state = STATE.NONE; }if (state !== STATE.NONE) { scope.dispatchEvent(_startEvent); } }
                function onTouchMove(event) { trackPointer(event); switch (state) { case STATE.TOUCH_ROTATE: if (scope.enableRotate === false) return; handleTouchMoveRotate(event); scope.update(); break; case STATE.TOUCH_PAN: if (scope.enablePan === false) return; handleTouchMovePan(event); scope.update(); break; case STATE.TOUCH_DOLLY_PAN: if (scope.enableZoom === false && scope.enablePan === false) return; handleTouchMoveDollyPan(event); scope.update(); break; case STATE.TOUCH_DOLLY_ROTATE: if (scope.enableZoom === false && scope.enableRotate === false) return; handleTouchMoveDollyRotate(event); scope.update(); break; default: state = STATE.NONE; } }
                function onContextMenu(event) { if (scope.enabled === false) return; event.preventDefault(); }
                function addPointer(event) { pointers.push(event); }
                function removePointer(event) { delete pointerPositions[event.pointerId]; for (var i = 0; i < pointers.length; i++) { if (pointers[i].pointerId == event.pointerId) { pointers.splice(i, 1); return; } } }
                function trackPointer(event) { var position = pointerPositions[event.pointerId]; if (position === undefined) { position = new THREE.Vector2(); pointerPositions[event.pointerId] = position; } position.set(event.pageX, event.pageY); }
                function getSecondPointerPosition(event) { var pointer = (event.pointerId === pointers[0].pointerId) ? pointers[1] : pointers[0]; return pointerPositions[pointer.pointerId]; }
                scope.domElement.addEventListener('contextmenu', onContextMenu);
                scope.domElement.addEventListener('pointerdown', onPointerDown);
                scope.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
                this.update();
            };
            THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
            THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;
        })();


        (function main() {

            
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;
            document.body.appendChild(renderer.domElement);

             
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a10);
            scene.fog = new THREE.FogExp2(0x0a0a10, 0.018);

            const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
            camera.position.set(18, 9, 22);


            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.minDistance = 4;
            controls.maxDistance = 80;
            controls.target.set(0, 0.5, 0);
            controls.update();


            
            const ambient = new THREE.AmbientLight(0x1a2040, 0.6);
            scene.add(ambient);

            
            const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
            dirLight.position.set(20, 40, 15);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = 1;
            dirLight.shadow.camera.far = 120;
            dirLight.shadow.camera.left = -30;
            dirLight.shadow.camera.right = 30;
            dirLight.shadow.camera.top = 30;
            dirLight.shadow.camera.bottom = -30;
            dirLight.shadow.bias = -0.001;
            scene.add(dirLight);

            
            const rimLight = new THREE.DirectionalLight(0x4080ff, 0.45);
            rimLight.position.set(-15, 12, -20);
            scene.add(rimLight);

            
            const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = 0;
            ground.receiveShadow = true;
            scene.add(ground);

            
            const gridOuter = new THREE.GridHelper(200, 40, 0x1a2550, 0x111828);
            gridOuter.position.y = 0.001;
            scene.add(gridOuter);

            
            const gridInner = new THREE.GridHelper(200, 200, 0x0d1530, 0x0d1530);
            gridInner.position.y = 0.002;
            scene.add(gridInner);

            

            const vehicle = new THREE.Group();
            scene.add(vehicle);

            
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0x1a2a6c,
                metalness: 0.82,
                roughness: 0.18,
                envMapIntensity: 1.0
            });

            
            const trimMat = new THREE.MeshStandardMaterial({
                color: 0x1a1c22,
                metalness: 0.9,
                roughness: 0.3
            });

            
            const glassMat = new THREE.MeshPhysicalMaterial({
                color: 0x88aacc,
                metalness: 0.0,
                roughness: 0.05,
                transmission: 0.88,
                transparent: true,
                opacity: 0.55,
                ior: 1.45,
                thickness: 0.5,
                reflectivity: 0.6,
                side: THREE.DoubleSide
            });

            
            const tyreMat = new THREE.MeshStandardMaterial({
                color: 0x111113,
                metalness: 0.0,
                roughness: 0.92
            });

            
            const rimMat = new THREE.MeshStandardMaterial({
                color: 0xc0c4cc,
                metalness: 0.95,
                roughness: 0.12
            });

            
            const accentMat = new THREE.MeshStandardMaterial({
                color: 0x2255ff,
                metalness: 0.3,
                roughness: 0.4,
                emissive: 0x0a1a55,
                emissiveIntensity: 0.3
            });

            
            const headlightMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfff5cc,
                emissiveIntensity: 4.5,
                metalness: 0.0,
                roughness: 0.0
            });

            
            const taillightMat = new THREE.MeshStandardMaterial({
                color: 0xff2200,
                emissive: 0xff2200,
                emissiveIntensity: 3.0,
                metalness: 0.0,
                roughness: 0.0
            });

            
            const chassisGeo = new THREE.BoxGeometry(4.4, 0.55, 9.0);
            const chassis = new THREE.Mesh(chassisGeo, bodyMat);
            chassis.position.y = 0.75;
            chassis.castShadow = true;
            chassis.receiveShadow = true;
            vehicle.add(chassis);

            
            const splitterGeo = new THREE.BoxGeometry(4.0, 0.08, 0.6);
            const splitter = new THREE.Mesh(splitterGeo, trimMat);
            splitter.position.set(0, 0.42, 4.7);
            splitter.castShadow = true;
            vehicle.add(splitter);

            
            const diffuserGeo = new THREE.BoxGeometry(3.6, 0.25, 0.5);
            const diffuser = new THREE.Mesh(diffuserGeo, trimMat);
            diffuser.position.set(0, 0.42, -4.65);
            diffuser.castShadow = true;
            vehicle.add(diffuser);

            
            [-2.28, 2.28].forEach(x => {
                const sill = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 8.4), trimMat);
                sill.position.set(x, 0.46, 0);
                sill.castShadow = true;
                vehicle.add(sill);
            });

            
            [-2.12, 2.12].forEach(x => {
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 8.2), accentMat);
                stripe.position.set(x, 0.7, 0);
                vehicle.add(stripe);
            });

            
            const wingBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.9), trimMat);
            wingBody.position.set(0, 1.68, -3.9);
            wingBody.castShadow = true;
            vehicle.add(wingBody);

            
            [-1.88, 1.88].forEach(x => {
                const ep = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.9), trimMat);
                ep.position.set(x, 1.38, -3.9);
                vehicle.add(ep);
            });

            
            [-0.9, 0.9].forEach(x => {
                const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), trimMat);
                pylon.position.set(x, 1.35, -3.9);
                vehicle.add(pylon);
            });

            
            const cabinGeo = new THREE.BoxGeometry(3.6, 0.8, 4.2);
            const cabin = new THREE.Mesh(cabinGeo, bodyMat);
            cabin.position.set(0, 1.52, 0.3);
            cabin.castShadow = true;
            vehicle.add(cabin);

            
            const roofGeo = new THREE.BoxGeometry(3.2, 0.15, 3.6);
            const roof = new THREE.Mesh(roofGeo, bodyMat);
            roof.position.set(0, 1.97, 0.3);
            roof.castShadow = true;
            vehicle.add(roof);

            
            const wsFrontGeo = new THREE.BoxGeometry(3.35, 0.95, 0.1);
            const wsFront = new THREE.Mesh(wsFrontGeo, glassMat);
            wsFront.position.set(0, 1.62, 2.4);
            wsFront.rotation.x = -0.32;
            vehicle.add(wsFront);

            
            const wsRearGeo = new THREE.BoxGeometry(3.05, 0.9, 0.1);
            const wsRear = new THREE.Mesh(wsRearGeo, glassMat);
            wsRear.position.set(0, 1.62, -1.9);
            wsRear.rotation.x = 0.32;
            vehicle.add(wsRear);

            
            [
                { x: 1.81, z: 0.3, ry: Math.PI / 2 },
                { x: -1.81, z: 0.3, ry: -Math.PI / 2 }
            ].forEach(({ x, z, ry }) => {
                const sw = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.72, 0.08), glassMat);
                sw.position.set(x, 1.62, z);
                sw.rotation.y = ry;
                vehicle.add(sw);
            });

            
            const hoodGeo = new THREE.BoxGeometry(4.0, 0.2, 3.2);
            const hood = new THREE.Mesh(hoodGeo, bodyMat);
            hood.position.set(0, 1.07, 3.0);
            hood.castShadow = true;
            vehicle.add(hood);

            
            const scoopGeo = new THREE.BoxGeometry(1.0, 0.18, 1.2);
            const scoop = new THREE.Mesh(scoopGeo, trimMat);
            scoop.position.set(0, 1.19, 2.8);
            vehicle.add(scoop);

            
            const trunkGeo = new THREE.BoxGeometry(4.0, 0.22, 1.8);
            const trunk = new THREE.Mesh(trunkGeo, bodyMat);
            trunk.position.set(0, 1.07, -3.2);
            trunk.castShadow = true;
            vehicle.add(trunk);

            
            const headlightSphere = new THREE.SphereGeometry(0.22, 8, 8);
            const headlights = [];

            [
                { x: -1.5, y: 0.88, z: 4.55 },
                { x: 1.5, y: 0.88, z: 4.55 }
            ].forEach(pos => {

                const housing = new THREE.Mesh(
                    new THREE.BoxGeometry(0.7, 0.28, 0.14), trimMat
                );
                housing.position.set(pos.x, pos.y, pos.z + 0.01);
                vehicle.add(housing);

                
                const lens = new THREE.Mesh(headlightSphere, headlightMat);
                lens.scale.set(1, 0.6, 0.6);
                lens.position.set(pos.x, pos.y, pos.z + 0.08);
                vehicle.add(lens);

                
                const spot = new THREE.SpotLight(0xfff5cc, 3.5, 50, Math.PI / 9, 0.4, 1.2);
                spot.position.set(pos.x, pos.y, pos.z + 0.1);
                spot.target.position.set(pos.x * 0.4, pos.y - 0.3, pos.z + 25);
                spot.castShadow = true;
                spot.shadow.mapSize.width = 512;
                spot.shadow.mapSize.height = 512;
                spot.shadow.camera.near = 0.5;
                spot.shadow.camera.far = 55;
                spot.shadow.bias = -0.002;
                vehicle.add(spot);
                vehicle.add(spot.target);
                headlights.push({ spot, lens });
            });


            [
                { x: -1.5, y: 0.88, z: -4.55 },
                { x: 1.5, y: 0.88, z: -4.55 }
            ].forEach(pos => {
                const housing = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.22, 0.12), trimMat
                );
                housing.position.set(pos.x, pos.y, pos.z - 0.01);
                vehicle.add(housing);

                const lens = new THREE.Mesh(
                    new THREE.BoxGeometry(0.55, 0.16, 0.08), taillightMat
                );
                lens.position.set(pos.x, pos.y, pos.z - 0.05);
                vehicle.add(lens);
            });

            
            const wheelPositions = [
                { x: -2.3, y: 0.58, z: 3.0, label: 'FL' },
                { x: 2.3, y: 0.58, z: 3.0, label: 'FR' },
                { x: -2.3, y: 0.58, z: -3.0, label: 'RL' },
                { x: 2.3, y: 0.58, z: -3.0, label: 'RR' }
            ];

            const wheelGroups = [];

            wheelPositions.forEach(({ x, y, z }) => {
                const wg = new THREE.Group();
                wg.position.set(x, y, z);
                vehicle.add(wg);
                wheelGroups.push(wg);

                
                const tyreGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.38, 16);
                const tyre = new THREE.Mesh(tyreGeo, tyreMat);
                tyre.rotation.z = Math.PI / 2;
                tyre.castShadow = true;
                tyre.receiveShadow = true;
                wg.add(tyre);

                
                const rimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16);
                const rim = new THREE.Mesh(rimGeo, rimMat);
                rim.rotation.z = Math.PI / 2;
                wg.add(rim);

                
                const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 8);
                const hub = new THREE.Mesh(hubGeo, rimMat);
                hub.rotation.z = Math.PI / 2;
                hub.position.x = (x < 0) ? -0.22 : 0.22;
                wg.add(hub);

                
                for (let s = 0; s < 5; s++) {
                    const angle = (s / 5) * Math.PI * 2;
                    const spoke = new THREE.Mesh(
                        new THREE.BoxGeometry(0.06, 0.26, 0.035), rimMat
                    );

                    spoke.position.set(
                        (x < 0) ? -0.19 : 0.19,
                        Math.sin(angle) * 0.22,
                        Math.cos(angle) * 0.22
                    );
                    spoke.rotation.x = angle;
                    wg.add(spoke);
                }
            });

            
            [-0.55, 0.55].forEach(xo => {
                const pipe = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.07, 0.5, 8),
                    new THREE.MeshStandardMaterial({ color: 0x888890, metalness: 0.95, roughness: 0.15 })
                );
                pipe.rotation.x = Math.PI / 2;
                pipe.position.set(xo, 0.42, -4.8);
                vehicle.add(pipe);
            });

            
            const ptCount = 1200;
            const ptPositions = new Float32Array(ptCount * 3);
            for (let i = 0; i < ptCount; i++) {
                ptPositions[i * 3] = (Math.random() - 0.5) * 180;
                ptPositions[i * 3 + 1] = Math.random() * 18;
                ptPositions[i * 3 + 2] = (Math.random() - 0.5) * 180;
            }
            const ptGeo = new THREE.BufferGeometry();
            ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPositions, 3));
            const pts = new THREE.Points(ptGeo, new THREE.PointsMaterial({
                color: 0x6080ff, size: 0.08, transparent: true, opacity: 0.55
            }));
            scene.add(pts);



            const CIRCUIT_RADIUS = 12;
            const VEHICLE_SPEED = 0.55;
            const WHEEL_RADIUS = 0.58;   
            const TWO_PI = Math.PI * 2;

            let circuitAngle = 0;
            let wheelSpin = 0;

            const clock = new THREE.Clock();

            
            const hudSpeed = document.getElementById('hud-speed');
            const hudRadius = document.getElementById('hud-radius');
            const hudRpm = document.getElementById('hud-rpm');

            function animate() {
                requestAnimationFrame(animate);
                const dt = clock.getDelta();

                
                circuitAngle += VEHICLE_SPEED * dt;


                vehicle.position.x = Math.cos(circuitAngle) * CIRCUIT_RADIUS;
                vehicle.position.z = Math.sin(circuitAngle) * CIRCUIT_RADIUS;
                vehicle.position.y = 0;


                vehicle.rotation.y = -circuitAngle - Math.PI / 2;

                
                const arcLength = CIRCUIT_RADIUS * VEHICLE_SPEED * dt;
                const dSpin = arcLength / WHEEL_RADIUS;
                wheelSpin += dSpin;

                wheelGroups.forEach(wg => {
                    
                    wg.rotation.x = wheelSpin;
                });

                
                pts.rotation.y += 0.0003;

                
                const speedMs = CIRCUIT_RADIUS * VEHICLE_SPEED;
                const speedKmh = (speedMs * 3.6).toFixed(1);
                const rpm = ((speedMs / WHEEL_RADIUS) * 60 / TWO_PI).toFixed(0);
                hudSpeed.textContent = speedKmh + ' km/h';
                hudRadius.textContent = CIRCUIT_RADIUS + ' m';
                hudRpm.textContent = rpm + ' RPM';

                
                controls.update();
                renderer.render(scene, camera);
            }

            animate();

            
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }, { passive: true });

        })();