<?php
namespace App\Controller;

use App\Form\AdvancedType;
use App\Html\MarkdownParser;
use App\Model\AdvancedModel;
use Elastica\Type;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Class HomeController
 */
class HomeController extends Controller
{
    /**
     * @var Type
     */
    protected $serverFinder;

    /**
     * @param Type $serverFinder
     */
    public function setServerFinder(Type $serverFinder)
    {
        $this->serverFinder = $serverFinder;
    }

    /**
     * @Route("/", name="home")
     *
     * @param Request $request
     *
     * @return Response
     */
    public function indexAction(Request $request)
    {
        $results = [];
        $page    = $request->query->getInt('page', 1);
        $term    = trim($request->query->get('term'));
        $parser  = new MarkdownParser();

        $model = new AdvancedModel();
        $query = $this->requestToQuery($request, $model);
        $terms = $this->splitTerms($term);

        $from = ($page - 1) * 20;
        $resp = $this->serverFinder->search($query, [
            'from' => $from,
            'size' => 20 + $from
        ]);

        $total = $resp->getTotalHits();
        $pages = ceil($total / 20);
        foreach ($resp->getResults() as $result) {
            $source = $result->getHit()['_source'];
            if (!empty($source['text'])) {
                $source['text'] = $parser->parse($source['text']);
            }
            $results[] = $source;
        }

        // dump($results);die();

        return $this->render('home/index.html.twig', [
            'results' => $results,
            'term'    => $term,
            'terms'   => $terms,
            'total'   => $total,
            'pages'   => $pages,
            'page'    => $page,
            'query'   => $model->toQueryString()
        ]);
    }

    /**
     * @param Request       $request
     * @param AdvancedModel $model
     *
     * @return array
     */
    protected function requestToQuery(Request $request, AdvancedModel $model)
    {
        if (!$request->getQueryString()) {
            return [
                'sort' => [
                    'created' => 'desc'
                ]
            ];
        }

        $form = $this->createAdvancedForm($model);
        $form->submit($request->query->all());

        $queryString = '';
        $filters     = [];
        if ($term = $model->getTerm()) {
            $queryString = $term;
        }

        $query = [
            'query' => [
                'bool' => []
            ]
        ];
        if ($queryString) {
            $query['query']['bool'] = [
                'must' => [
                    'query_string' => [
                        'query' => $queryString
                    ]
                ]
            ];
        }

        if ($author = $model->getAuthor()) {
            $filters['author'] = str_replace('/u/', '', $author);
        }
        if ($flair = $model->getFlair()) {
            $filters['flair'] = $flair;
        }
        if ($domain = $model->getDomain()) {
            $filters['domain'] = $domain;
        }

        if (!empty($filters)) {
            $query['query']['bool']['filter'] = [
                'bool' => [
                    'must' => []
                ]
            ];
            foreach ($filters as $key => $value) {
                $query['query']['bool']['filter']['bool']['must'][] = [
                    'term' => [
                        $key => $value
                    ]
                ];
            }
        }

        $startDate = $model->getStartDate();
        $endDate   = $model->getEndDate();
        if ($startDate || $endDate) {
            $query['query']['range'] = [
                'created' => []
            ];
            if ($startDate) {
                $query['query']['range']['created']['gte'] = $startDate->getTimestamp();
            }
            if ($endDate) {
                $query['query']['range']['created']['lte'] = $endDate->getTimestamp();
            }
        }

        if (empty($query['query']['bool'])) {
            unset($query['query']['bool']);
        }

        return $query;
    }

    /**
     * @Route("/advanced", name="advanced")
     *
     * @param Request $request
     *
     * @return Response
     */
    public function advancedAction(Request $request)
    {
        $model = new AdvancedModel();
        $form  = $this->createAdvancedForm($model);
        $form->submit($request->query->all());

        return $this->render('home/advanced.html.twig', [
            'form' => $form->createView()
        ]);
    }

    /**
     * @param string $term
     *
     * @return array
     */
    protected function splitTerms($term)
    {
        return array_values(array_filter(explode(' ', $term)));
    }

    /**
     * @param object $model
     *
     * @return FormInterface
     */
    protected function createAdvancedForm($model)
    {
        $data = $this->redis->hMGet('flairsAndDomains', ['flairs', 'domains']);
        if (!$data || empty($data['flairs']) || empty($data['domains'])) {
            $resp = $this->serverFinder->search(
                [
                    'size' => 0,
                    'aggs' => [
                        'flairs'  => [
                            'terms' => [
                                'field' => 'flair'
                            ]
                        ],
                        'domains' => [
                            'terms' => [
                                'field' => 'domain'
                            ]
                        ]
                    ]
                ]
            );

            $domains = [];
            $flairs  = [];
            $buckets = $resp->getResponse()->getData()['aggregations']['flairs']['buckets'];
            foreach ($buckets as $bucket) {
                $flairs[] = $bucket['key'];
            }
            usort($flairs, function($a, $b) {
                return strcasecmp($a, $b);
            });
            $buckets = $resp->getResponse()->getData()['aggregations']['domains']['buckets'];
            foreach ($buckets as $bucket) {
                $domains[] = $bucket['key'];
            }
            usort($domains, function($a, $b) {
                return strcasecmp($a, $b);
            });

            $this->redis->hMSet('flairsAndDomains', [
                'flairs'  => json_encode($flairs),
                'domains' => json_encode($domains)
            ]);
            $this->redis->expire('flairsAndDomains', 60);
        } else {
            $flairs  = json_decode($data['flairs'], true);
            $domains = json_decode($data['domains'], true);
        }

        return $this->createForm(AdvancedType::class, $model, [
            'flairs'  => $flairs,
            'domains' => $domains,
            'method'  => 'get',
            'action'  => $this->generateUrl('home')
        ]);
    }
}
