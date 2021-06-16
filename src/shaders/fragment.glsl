
uniform samplerCube tCube;
uniform sampler2D uBackfaceMap;
uniform vec2 uResolution;

uniform vec3 uColor;
uniform float uRefractionRatio;
uniform float uFresnelBias;
uniform float uFresnelScale;
uniform float uFresnelPower;
uniform float uBackfaceVisibility;

varying vec3 worldNormal;
varying vec3 viewDirection;

void main() {

	// Backface Normals
	vec3 backfaceNormal = texture2D(uBackfaceMap, gl_FragCoord.xy / uResolution).rgb;

	// Reflection
	vec3 vReflect = reflect(viewDirection, worldNormal);
	float vReflectionFactor = uFresnelBias + uFresnelScale * pow(1.0 + dot(normalize(viewDirection), worldNormal), uFresnelPower);

	// Refraction
	vec3 vRefract[3];
	vec3 normal = worldNormal * (1.0 - uBackfaceVisibility) - backfaceNormal * uBackfaceVisibility;
	vRefract[0] = refract(normalize(viewDirection), normal, uRefractionRatio);
	vRefract[1] = refract(normalize(viewDirection), normal, uRefractionRatio * 0.99);
	vRefract[2] = refract(normalize(viewDirection), normal, uRefractionRatio * 0.98);

	// Reflected Color
	vec4 reflectedColor = textureCube(tCube, vec3(-vReflect.x, vReflect.yz));

	// Refracted Color
	vec4 refractedColor = vec4(1.0);
	refractedColor.r = textureCube(tCube, vec3(-vRefract[0].x, vRefract[0].yz)).r;
	refractedColor.g = textureCube(tCube, vec3(-vRefract[1].x, vRefract[1].yz)).g;
	refractedColor.b = textureCube(tCube, vec3(-vRefract[2].x, vRefract[2].yz)).b;

	gl_FragColor = mix(refractedColor, reflectedColor, clamp(vReflectionFactor, 0.0, 1.0)) * vec4(uColor, 1.0);

}