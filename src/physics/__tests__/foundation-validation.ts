import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { DiceManager, PhysicsUtils } from '../index';

/**
 * Simple validation script to test our physics foundation
 * This confirms the basic components work before implementing concrete dice types
 */
export function validatePhysicsFoundation(): boolean {
    console.log('🔬 Starting Physics Foundation Validation...\n');

    let testsPassed = 0;
    let totalTests = 0;

    // Helper function for test assertions
    function test(name: string, testFn: () => boolean): void {
        totalTests++;
        try {
            const result = testFn();
            if (result) {
                console.log(`✅ ${name}`);
                testsPassed++;
            } else {
                console.log(`❌ ${name} - Test failed`);
            }
        } catch (error) {
            console.log(`❌ ${name} - Error: ${error}`);
        }
    }

    // Test 1: DiceManager Initialization
    test('DiceManager can initialize physics world', () => {
        DiceManager.setWorld();
        return DiceManager.isInitialized() && DiceManager.getWorld() !== null;
    });

    // Test 2: Materials Setup
    test('DiceManager creates physics materials', () => {
        const materials = DiceManager.getMaterials();
        return materials !== null &&
            materials.dice instanceof CANNON.Material &&
            materials.floor instanceof CANNON.Material &&
            materials.barrier instanceof CANNON.Material;
    });

    // Test 3: World Configuration
    test('Physics world has correct configuration', () => {
        const world = DiceManager.getWorld();
        const gravity = DiceManager.getGravity();
        return world !== null &&
            gravity !== null &&
            Math.abs(gravity.y + 9.82) < 0.01 && // Default gravity
            world.broadphase instanceof CANNON.NaiveBroadphase;
    });

    // Test 4: Body Management
    test('Can add and remove bodies from physics world', () => {
        const world = DiceManager.getWorld();
        const initialBodyCount = DiceManager.getBodyCount();

        // Create a simple test body
        const testBody = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
        });

        DiceManager.addBody(testBody);
        const afterAddCount = DiceManager.getBodyCount();

        DiceManager.removeBody(testBody);
        const afterRemoveCount = DiceManager.getBodyCount();

        return afterAddCount === initialBodyCount + 1 &&
            afterRemoveCount === initialBodyCount;
    });

    // Test 5: Physics Stepping
    test('Physics world can step simulation', () => {
        try {
            DiceManager.step(); // Should not throw
            DiceManager.step(1 / 60); // Custom timestep
            return true;
        } catch (error) {
            return false;
        }
    });

    // Test 6: PhysicsUtils Vector Conversions
    test('PhysicsUtils can convert between Three.js and Cannon.js vectors', () => {
        const threeVec = new THREE.Vector3(1, 2, 3);
        const cannonVec = PhysicsUtils.threeVectorToCannon(threeVec);
        const backToThree = PhysicsUtils.cannonVectorToThree(cannonVec);

        return Math.abs(threeVec.x - backToThree.x) < 0.001 &&
            Math.abs(threeVec.y - backToThree.y) < 0.001 &&
            Math.abs(threeVec.z - backToThree.z) < 0.001;
    });

    // Test 7: PhysicsUtils Quaternion Conversions  
    test('PhysicsUtils can convert between Three.js and Cannon.js quaternions', () => {
        const threeQuat = new THREE.Quaternion(0.1, 0.2, 0.3, 0.9).normalize();
        const cannonQuat = PhysicsUtils.threeQuaternionToCannon(threeQuat);
        const backToThree = PhysicsUtils.cannonQuaternionToThree(cannonQuat);

        return Math.abs(threeQuat.x - backToThree.x) < 0.001 &&
            Math.abs(threeQuat.y - backToThree.y) < 0.001 &&
            Math.abs(threeQuat.z - backToThree.z) < 0.001 &&
            Math.abs(threeQuat.w - backToThree.w) < 0.001;
    });

    // Test 8: PhysicsUtils Shape Creation
    test('PhysicsUtils can create basic physics shapes', () => {
        const box = PhysicsUtils.createBoxShape(2, 4, 6);
        const sphere = PhysicsUtils.createSphereShape(5);
        const cylinder = PhysicsUtils.createCylinderShape(2, 3, 10);

        return box instanceof CANNON.Box &&
            sphere instanceof CANNON.Sphere &&
            cylinder instanceof CANNON.Cylinder &&
            Math.abs(sphere.radius - 5) < 0.001;
    });

    // Test 9: PhysicsUtils Geometry Conversion
    test('PhysicsUtils can convert Three.js geometry to Cannon.js ConvexPolyhedron', () => {
        const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
        const shape = PhysicsUtils.createConvexPolyhedronFromGeometry(boxGeometry);

        return shape instanceof CANNON.ConvexPolyhedron &&
            shape.vertices.length > 0 &&
            shape.faces.length > 0;
    });

    // Test 10: DiceManager Throw Status
    test('DiceManager throw status reporting works', () => {
        const status = DiceManager.getThrowStatus();

        return typeof status.isRunning === 'boolean' &&
            typeof status.worldInitialized === 'boolean' &&
            typeof status.bodyCount === 'number' &&
            status.worldInitialized === true &&
            status.isRunning === false;
    });

    // Test 11: Stability Checking (with mock dice)
    test('DiceManager stability checking handles invalid dice gracefully', () => {
        const invalidDice = null;
        const invalidDice2 = { object: null };
        const invalidDice3 = { object: { userData: {} } };

        return DiceManager.isDiceStable(invalidDice) === false &&
            DiceManager.isDiceStable(invalidDice2) === false &&
            DiceManager.isDiceStable(invalidDice3) === false;
    });

    // Test 12: World Reset
    test('DiceManager can reset the physics world', () => {
        const initialBodyCount = DiceManager.getBodyCount();

        // Add a test body
        const testBody = new CANNON.Body({ mass: 1, shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)) });
        DiceManager.addBody(testBody);

        // Reset the world
        DiceManager.resetWorld();

        return DiceManager.isInitialized() &&
            DiceManager.getBodyCount() === 0; // Should be clean after reset
    });

    // Summary
    console.log(`\n📊 Validation Summary:`);
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`${testsPassed === totalTests ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);

    if (testsPassed === totalTests) {
        console.log(`\n🚀 Physics foundation is solid! Ready for dice geometry implementation.`);
    } else {
        console.log(`\n🔧 Fix the failing tests before proceeding.`);
    }

    return testsPassed === totalTests;
} 