<?php
namespace App\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

/**
 * Class HighlightExtension
 */
class HighlightExtension extends AbstractExtension
{
    /**
     * @return TwigFilter[]
     */
    public function getFilters()
    {
        return [
            new TwigFilter('highlight', [$this, 'highlight'], ['is_safe' => ['html']])
        ];
    }

    /**
     * @param string $str
     * @param string $term
     * @param int    $words
     * @param int    $maxWords
     * @param string $tag
     *
     * @return string|string[]|null
     */
    public function highlight($str, $term, $words = 5, $maxWords = 50, $tag = 'b')
    {
        if (stripos($str, $term) === false) {
            $parts    = explode(' ', $str);
            $parts    = array_slice($parts, 0, $maxWords);
            $sentence = join(' ', $parts);
            if (strlen($str) > strlen($sentence)) {
                $sentence .= '...';
            }

            return $sentence;
        }

        $needles  = explode(" ",strip_tags($term));   //needles words
        $haystack = explode(" ",strip_tags($str));   //haystack words

        $c = [];                       //array of words to keep/remove
        for ($j = 0; $j < count($haystack); $j++) {
            $c[$j] = false;
        }

        for ($i = 0; $i < count($haystack); $i++) {
            for ($k = 0; $k < count($needles); $k++) {
                if (stristr($haystack[$i], $needles[$k])) {
                    $haystack[$i] = preg_replace("/" . $needles[$k] . "/i", '<span class="highlight">\\0</span>', $haystack[$i]);
                    for ($j = max($i - $words, 0); $j < min($i + $words, count($haystack)); $j++) {
                        $c[$j] = true;
                    }
                }
            }
        }

        $result = ""; // reassembly words to keep
        for ($j = 0; $j < count($haystack); $j++) {
            if ($c[$j]) {
                $result .= " " . $haystack[$j];
            } else {
                $result .= ".";
            }
        }

        return preg_replace("/\.{3,}/i", "...", $result);
    }
}
