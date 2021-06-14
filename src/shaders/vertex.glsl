
varying vec3 worldNormal;
varying vec3 viewDirection;

void main() {

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vec4 worldPosition = modelMatrix * vec4(position, 1.0);

	worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
	viewDirection = worldPosition.xyz - cameraPosition;

	gl_Position = projectionMatrix * mvPosition;

}