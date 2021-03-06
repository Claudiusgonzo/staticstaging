# This is the SCC preamble for WebGL programs. It includes the functions
# provided by the `glrt` runtime library. It also includes some
# dingus-specific matrices from the `dingus` map.

# Externs for the dingus parameter matrices.
extern dingus.projection: Mat4;
extern dingus.view: Mat4;

# And local bindings, to make them non-pervasive.
var projection = dingus.projection;
var view = dingus.view;

# Sample assets to play with.
extern bunny: Mesh;
extern teapot: Mesh;
extern snowden: Mesh;

# Mesh asset wrangling.
extern mesh_indices: Mesh -> (Int3 Array);
extern mesh_positions: Mesh -> (Float3 Array);
extern mesh_normals: Mesh -> (Float3 Array);
extern mesh_size: Mesh -> Int;
extern draw_mesh: (Int3 Array) Int -> Void;

# Matrix manipulation library.
extern mat4.create: -> Mat4;
extern mat4.rotate: Mat4 Mat4 Float Vec3 -> Void;
extern mat4.rotateX: Mat4 Mat4 Float -> Void;
extern mat4.rotateY: Mat4 Mat4 Float -> Void;
extern mat4.rotateZ: Mat4 Mat4 Float -> Void;
extern mat4.scale: Mat4 Mat4 Vec3 -> Void;
extern mat4.translate: Mat4 Mat4 Vec3 -> Void;
extern mat4.transpose: Mat4 Mat4 -> Void;
extern mat4.scale: Mat4 Mat4 Vec3 -> Void;
extern mat4.invert: Mat4 Mat4 -> Void;

# Get the camera position (in world space) from a view matrix.
extern eye: Mat4 -> Vec3;

# Textures.
extern a_texture: -> Texture;  # FIXME EXPERIMENTAL

# Standard JavaScript functions.
extern Date.now: -> Float;
extern Math.sin: Float -> Float;
extern Math.cos: Float -> Float;
