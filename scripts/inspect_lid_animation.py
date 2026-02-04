"""
Blender script to inspect the "lid" object and find the "delete this" animation.
Run this in Blender's Scripting tab (Alt+P) or from command line.

Output is saved to: ~/Desktop/lid_inspection.txt
"""

import bpy
import os

output_lines = []

def log(msg=""):
    print(msg)
    output_lines.append(msg)

obj_name = "lid"
obj = bpy.data.objects.get(obj_name)

if not obj:
    # Try case-insensitive search
    for o in bpy.data.objects:
        if o.name.lower() == obj_name.lower():
            obj = o
            break

if not obj:
    log(f"Object '{obj_name}' not found. Available objects:")
    for o in bpy.data.objects:
        log(f"  - {o.name}")
else:
    log(f"=== Inspecting: {obj.name} ===")
    log()

    # Check animation data
    if obj.animation_data:
        anim = obj.animation_data
        log("Animation Data found:")

        # Active action
        if anim.action:
            log(f"\n  Active Action: '{anim.action.name}'")
            for fc in anim.action.fcurves:
                log(f"    - {fc.data_path} [{fc.array_index}]: {len(fc.keyframe_points)} keyframes")

        # NLA tracks
        if anim.nla_tracks:
            log(f"\n  NLA Tracks ({len(anim.nla_tracks)}):")
            for track in anim.nla_tracks:
                log(f"    Track: '{track.name}' (muted={track.mute})")
                for strip in track.strips:
                    log(f"      Strip: '{strip.name}' -> Action: '{strip.action.name if strip.action else 'None'}'")
                    log(f"        Frame range: {strip.frame_start} - {strip.frame_end}")
    else:
        log("No animation_data on object")

    # Check all actions in file for references
    log("\n=== All Actions in file ===")
    for action in bpy.data.actions:
        log(f"  '{action.name}' (users={action.users})")
        if "delete" in action.name.lower():
            log(f"    ^ FOUND 'delete' in name!")
            log(f"    FCurves:")
            for fc in action.fcurves:
                log(f"      - {fc.data_path}")

    # Check if lid has any drivers
    if obj.animation_data and obj.animation_data.drivers:
        log(f"\n=== Drivers on {obj.name} ===")
        for driver in obj.animation_data.drivers:
            log(f"  - {driver.data_path}")

    # Check shape keys if mesh
    if obj.type == 'MESH' and obj.data.shape_keys:
        sk = obj.data.shape_keys
        log(f"\n=== Shape Keys ===")
        if sk.animation_data and sk.animation_data.action:
            log(f"  Shape Key Action: '{sk.animation_data.action.name}'")

# Save to file on Desktop
output_path = os.path.expanduser("~/Desktop/lid_inspection.txt")
with open(output_path, "w") as f:
    f.write("\n".join(output_lines))
log(f"\n>>> Results saved to: {output_path}")
