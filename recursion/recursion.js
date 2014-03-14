var renderer, scene, camera, gui, container, stats,
    begin = new THREE.Vector3( 0, 0, 0 ),
    dir = new THREE.Vector3( 0, 1, 0 ),
    angle = 13,
    length = 2,
    depth = 2;

function drawLine( start, end, width ) {
    var material = new THREE.LineBasicMaterial( { 
        color: randColour(),
        linewidth: width
    } );

    var geometry = new THREE.Geometry();
    geometry.vertices.push( end );
    geometry.vertices.push( start );

    var line = new THREE.Line( geometry, material );
    scene.add( line );
}

function randColour() {
    var colour = ('0x' + parseInt(randInt(75, 255)).toString(16) + 
        parseInt(randInt(75, 255)).toString(16) + 
        parseInt(randInt(75, 255)).toString(16));
    return parseInt(colour);
}

function randInt( min, max ) {
    return Math.floor(Math.random() * ((max-min)+1.0) + min);
}

function randFloat( min, max ) {
    return Math.random() * ((max-min)+1.0) + min;
}

function vectorOnCircle( rad ) {
    var x = randFloat(-rad, rad),
        z = randFloat(-rad, rad),
        vec = new THREE.Vector3(x, 0, z);
    vec.normalize();
    vec * rad;
    return vec;
}

function deg2rad( deg ) {
    return deg * Math.PI/180;
}

function rad2deg( rad ) {
    return rad * 180/Math.PI;
}

function aimY( growthDir ) {
    var out = new Array(),
        xAngle,
        zAngle;
  
    var xyLength = Math.sqrt(growthDir.x * growthDir.x + growthDir.y * growthDir.y),
        vecLength = Math.sqrt(growthDir.x * growthDir.x + growthDir.y * growthDir.y + growthDir.z * growthDir.z);
  
    if ( xyLength == 0 ) {
        zAngle = growthDir.x > 0 ? deg2rad(90) : deg2rad(-90);
    } else {
        zAngle = Math.acos((growthDir.y)/xyLength);
    }
  
    xAngle = Math.acos(xyLength/vecLength);
  
    xAngle = growthDir.z > 0 ? xAngle : -xAngle;
    out.push(rad2deg(xAngle));
 
    zAngle = growthDir.x > 0 ? -zAngle : zAngle;
    out.push(rad2deg(zAngle));
    return out;
}

function tree( depth, base, growthDir, branchAngle, branchLen ) {
    if (depth <= 0 ){return;}
    
    var rad = branchLen * Math.sin( deg2rad(branchAngle) );
    var vec = vectorOnCircle( rad );
    vec.y = branchLen;

    var xaxis = new THREE.Vector3( 1, 0, 0 ),
        zaxis = new THREE.Vector3( 0, 0, 1 );

    var angle = aimY(growthDir);
    vec.applyAxisAngle( xaxis, deg2rad(angle[0]) );
    vec.applyAxisAngle( zaxis, deg2rad(angle[1]) );
    
    var end = new THREE.Vector3( vec.x+base.x, Math.abs(vec.y)+base.y, vec.z+base.z );
    var reflectedVec = new THREE.Vector3( vec.x, vec.y, vec.z );
    reflectedVec.multiplyScalar( -1 );
    reflectedVec.reflect( growthDir );
    reflectedVec.y = Math.abs( reflectedVec.y );
    reflectedVec.normalize();
    var end2 = new THREE.Vector3( (base.x+reflectedVec.x), (base.y+reflectedVec.y), (base.z+reflectedVec.z) );
    drawLine( base, end, depth );
    drawLine( base, end2, depth );
    tree( depth-1, end, vec, branchAngle, branchLen*0.6 );
    tree( depth-1, end2, reflectedVec, branchAngle, branchLen*0.6 );
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '35px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );
}

function clearTree() {
    count = scene.children.length;
    for (var i=count;i>=0;i--) {
        child = scene.children[i];
        if ( child instanceof THREE.GridHelper ) {continue;}
        if ( child instanceof THREE.Line ) {
            scene.remove(child);
        }
    }
}

function updateTree( controls ) {
    clearTree();
    tree( controls.count, begin, dir, controls.angle, controls.length );
}

function render() {
    renderer.render( scene, camera );
}

function init() {
    scene = new THREE.Scene();
    var grid = new THREE.GridHelper( 10, 2.5 )
    scene.add( grid );
    setupRenderer();
    
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera( 60, aspect, 1, 50 );
    orbit = new THREE.OrbitControls( camera, container );
    orbit.addEventListener( 'change', render );
    camera.position.z = 10;
    camera.position.y = 5;
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
    camera.updateProjectionMatrix();

    var Controls = function() {
        this.angle = angle;
        this.length = length;
        this.count = depth;
        this.update = function () {updateTree(this)};
    };

    var controls = new Controls();
    gui = new dat.GUI();
    gui.add( controls, 'angle' );
    gui.add( controls, 'length', 1 );
    gui.add( controls, 'count', 1, 15 ).step( 1 );
    gui.add( controls, 'update');
    gui.domElement.style.paddingTop = '55px';
    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
}


init();
tree( depth, begin, dir, angle, length );
animate();
