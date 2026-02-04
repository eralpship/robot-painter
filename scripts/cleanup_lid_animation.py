"""
Blender script to clean up lid animation:
- Removes the 'close lid' NLA strip
- Removes the 'delete this' action from the file
- Keeps only the 'open lid' animation

Run in Blender's Scripting tab (Alt+P). Save your file after!
"""

import bpy

lid = bpy.data.objects.get("lid")

if not lid:
    print("ERROR: 'lid' object not found")
elif not lid.animation_data:
    print("ERROR: 'lid' has no animation data")
else:
    # Remove the 'close lid' strip from NLA tracks
    for track in lid.animation_data.nla_tracks:
        for strip in list(track.strips):  # list() to avoid modifying while iterating
            if strip.action and strip.action.name == "delete this":
                print(f"Removing NLA strip: '{strip.name}' (action: '{strip.action.name}')")
                track.strips.remove(strip)

    print("Cleaned up NLA strips on 'lid'")

# Remove the 'delete this' action from the file
action = bpy.data.actions.get("delete this")
if action:
    print(f"Removing action: 'delete this' (users={action.users})")
    bpy.data.actions.remove(action)
    print("Removed 'delete this' action from file")
else:
    print("'delete this' action already removed or not found")

print("\nDone! Don't forget to save your .blend file (Ctrl+S)")
