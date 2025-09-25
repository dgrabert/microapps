set -eu

if [[ $# != 1 ]]
then
    echo "usage: $0 TAG" >&2
    exit 1
fi

has_changes=$(git status --porcelain)

if [[ $has_changes ]]
then
    echo "nao eh possivel gerar release pq existem alteracoes nao commitadas:"
    echo "$has_changes"
    exit 1
fi

tag=$1

sed -i "s/\"version\".*/\"version\": \"$tag\",/" deno.json
has_changes=$(git status --porcelain)

if [[ $has_changes ]]
then
    git add deno.json
    git commit -m "$tag"
fi

git tag $tag
git push origin $tag

deno publish --no-check
