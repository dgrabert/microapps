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

echo "> atualizando deno.json pra versao $tag"
sed -i "s/\"version\".*/\"version\": \"$tag\",/" deno.json
has_changes=$(git status --porcelain)

if [[ $has_changes ]]
then
    echo "> commit do deno.json"
    git add deno.json
    git commit -m "$tag"
else
    echo "> deno.json ja esta na versao correta"
fi

echo "> criando tag $tag no commit atual e subindo pro remote"
git tag $tag
git push origin $tag
git push

echo "> publicando no JSR"
deno publish --no-check
