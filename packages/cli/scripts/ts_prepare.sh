#!/bin/bash

# This script simply renames a .js file to a .ts using git move, 
# and then runs ESLint on the file. The idea is that the script
# is used on one file at a time. 
# It removes some of the more annoying, repetitive style related tasks when porting Javascript files to Typescript.

# Parse input.
FILE_JS=$1'.js'
FILE_TS=$1'.ts'
echo 'Preparing '$FILE_JS' for Typescript migration'

# Validate input.
if [ ! -f $FILE_JS ]; then
  echo "File not found!"
  exit 1
fi
if [ -e $FILE_TS ]; then
  echo "Typescript file already exists!"
  exit 1
fi

# First rename the selected file. 
# Use git mv instead of mv to signal a rename instead of a create/delete operation to git.
echo 'Renaming file '$FILE_JS' => '$FILE_TS'...'
git mv $FILE_JS $FILE_TS

# Use a prompt to validate what files will be changed.
echo
echo 'The following changes will be made:'
npm run lint
echo
read -p "The files listed above will be modified, do you want to continue?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  # Change the files.
  npm run lintfix
else
  # Undo the renaming othewise.
  echo 'Undoing file rename '$FILE_TS' => '$FILE_JS'...'
  git mv $FILE_TS $FILE_JS
fi
