
varying vec3 vWorldNormal;

void main() {

    vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vWorldNormal = -normalize(vec3(-vWorldNormal.x, vWorldNormal.yz));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}